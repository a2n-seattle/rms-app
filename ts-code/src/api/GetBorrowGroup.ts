import { ITEMS_TABLE, ItemsSchema } from "../db/Schemas"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"
import { ScanCommandInput, ScanCommandOutput } from "@aws-sdk/lib-dynamodb"

/**
 * Looks up every currently-borrowed item sharing a borrowGroupId -- i.e.
 * everything borrowed together via a single BorrowFromSchedule call -- so
 * the batched return flow can pull up a confirmation page listing the
 * whole group instead of just one item. No GSI on borrowGroupId today, so
 * this is a Scan+FilterExpression, same shape/caveats as the other list
 * APIs in this file's siblings (FilterExpression applies after any
 * DynamoDB-side Limit; a plain unbounded Scan is used here since a borrow
 * group is expected to be small - the same items selected together in one
 * basket borrow - not a table-wide listing).
 */
export class GetBorrowGroup {
    public static NAME: string = "get borrow group"

    private readonly client: DBClient
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.client = client
        this.metrics = metrics
    }

    public execute(input: GetBorrowGroupInput): Promise<GetBorrowGroupResult> {
        return emitAPIMetrics(
            () => {
                return this.performAllFVAs(input)
                    .then(() => {
                        const params: ScanCommandInput = {
                            TableName: ITEMS_TABLE,
                            FilterExpression: "#borrowGroupId = :borrowGroupId",
                            ExpressionAttributeNames: {
                                "#borrowGroupId": "borrowGroupId"
                            },
                            ExpressionAttributeValues: {
                                ":borrowGroupId": input.borrowGroupId
                            }
                        }

                        return this.client.scan(params)
                            .then((output: ScanCommandOutput) => ({
                                items: (output.Items ?? []) as ItemsSchema[]
                            }))
                    })
            },
            GetBorrowGroup.NAME, this.metrics
        )
    }

    private performAllFVAs(input: GetBorrowGroupInput): Promise<void> {
        return new Promise((resolve, reject) => {
            if (input.borrowGroupId == undefined) {
                reject(new Error("Missing required field 'borrowGroupId'"))
            }
            resolve()
        })
    }
}

export interface GetBorrowGroupInput {
    borrowGroupId?: string
}

export interface GetBorrowGroupResult {
    items: ItemsSchema[]
}
