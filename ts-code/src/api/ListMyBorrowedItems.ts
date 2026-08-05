import { ITEMS_TABLE, ItemsSchema } from "../db/Schemas"
import { decodePageToken } from "../db/PageToken"
import { scanUntilLimit } from "../db/scanUntilLimit"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"
import { ScanCommandInput } from "@aws-sdk/lib-dynamodb"

const DEFAULT_PAGE_SIZE = 25

/**
 * Lists items currently borrowed by a given borrower, paginated via
 * scanUntilLimit (see db/scanUntilLimit.ts for the Scan+FilterExpression
 * pagination gotcha it works around).
 */
export class ListMyBorrowedItems {
    public static NAME: string = "list my borrowed items"

    private readonly client: DBClient
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.client = client
        this.metrics = metrics
    }

    public execute(input: ListMyBorrowedItemsInput): Promise<ListMyBorrowedItemsResult> {
        return emitAPIMetrics(
            () => {
                return this.performAllFVAs(input)
                    .then(() => {
                        const params: ScanCommandInput = {
                            TableName: ITEMS_TABLE,
                            Limit: input.limit ?? DEFAULT_PAGE_SIZE,
                            FilterExpression: "#borrower = :borrower",
                            ExpressionAttributeNames: {
                                "#borrower": "borrower"
                            },
                            ExpressionAttributeValues: {
                                ":borrower": input.borrower
                            },
                            ...(input.pageToken ? { ExclusiveStartKey: decodePageToken(input.pageToken) } : {})
                        }

                        return scanUntilLimit<ItemsSchema>(this.client, params, input.limit ?? DEFAULT_PAGE_SIZE)
                    })
            },
            ListMyBorrowedItems.NAME, this.metrics
        )
    }

    private performAllFVAs(input: ListMyBorrowedItemsInput): Promise<void> {
        return new Promise((resolve, reject) => {
            if (input.borrower == undefined) {
                reject(new Error("Missing required field 'borrower'"))
            }
            resolve()
        })
    }
}

export interface ListMyBorrowedItemsInput {
    borrower?: string,
    limit?: number,
    pageToken?: string
}

export interface ListMyBorrowedItemsResult {
    items: ItemsSchema[],
    nextPageToken?: string
}
