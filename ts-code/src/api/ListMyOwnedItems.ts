import { MAIN_TABLE, MainSchema } from "../db/Schemas"
import { encodePageToken, decodePageToken } from "../db/PageToken"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"
import { ScanCommandInput, ScanCommandOutput } from "@aws-sdk/lib-dynamodb"

const DEFAULT_PAGE_SIZE = 25

/**
 * Lists item types owned by a given Cognito user (matched against
 * `MainSchema.ownerId`, resolved at item-creation time -- see AddItem.ts's
 * owner-by-email Cognito lookup), paginated. Scan+FilterExpression on
 * MainTable, same shape/caveats as ScheduleTable.listByBorrower
 * (FilterExpression applies after Limit, so a short/empty page doesn't
 * mean no more data - keep paging until nextPageToken is undefined).
 *
 * Items whose owner never resolved to a real Cognito user (a room, "the
 * church", etc. -- `ownerId` left unset) never show up here.
 */
export class ListMyOwnedItems {
    public static NAME: string = "list my owned items"

    private readonly client: DBClient
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.client = client
        this.metrics = metrics
    }

    public execute(input: ListMyOwnedItemsInput): Promise<ListMyOwnedItemsResult> {
        return emitAPIMetrics(
            () => {
                return this.performAllFVAs(input)
                    .then(() => {
                        const params: ScanCommandInput = {
                            TableName: MAIN_TABLE,
                            Limit: input.limit ?? DEFAULT_PAGE_SIZE,
                            FilterExpression: "#ownerId = :ownerId",
                            ExpressionAttributeNames: {
                                "#ownerId": "ownerId"
                            },
                            ExpressionAttributeValues: {
                                ":ownerId": input.ownerId
                            },
                            ...(input.pageToken ? { ExclusiveStartKey: decodePageToken(input.pageToken) } : {})
                        }

                        return this.client.scan(params)
                            .then((output: ScanCommandOutput) => ({
                                items: (output.Items ?? []) as MainSchema[],
                                nextPageToken: output.LastEvaluatedKey ? encodePageToken(output.LastEvaluatedKey) : undefined
                            }))
                    })
            },
            ListMyOwnedItems.NAME, this.metrics
        )
    }

    private performAllFVAs(input: ListMyOwnedItemsInput): Promise<void> {
        return new Promise((resolve, reject) => {
            if (input.ownerId == undefined) {
                reject(new Error("Missing required field 'ownerId'"))
            }
            resolve()
        })
    }
}

export interface ListMyOwnedItemsInput {
    ownerId?: string,
    limit?: number,
    pageToken?: string
}

export interface ListMyOwnedItemsResult {
    items: MainSchema[],
    nextPageToken?: string
}
