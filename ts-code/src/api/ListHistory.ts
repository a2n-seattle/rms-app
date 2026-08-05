import { HISTORY_TABLE, HistorySchema } from "../db/Schemas"
import { decodePageToken } from "../db/PageToken"
import { scanUntilLimit } from "../db/scanUntilLimit"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"
import { ScanCommandInput } from "@aws-sdk/lib-dynamodb"

const DEFAULT_PAGE_SIZE = 25

/**
 * Lists borrow/return history entries for a given borrower, paginated via
 * scanUntilLimit (no GSI on HistorySchema.borrower today -- see
 * db/scanUntilLimit.ts for the Scan+FilterExpression pagination gotcha it
 * works around).
 */
export class ListHistory {
    public static NAME: string = "list history"

    private readonly client: DBClient
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.client = client
        this.metrics = metrics
    }

    public execute(input: ListHistoryInput): Promise<ListHistoryResult> {
        return emitAPIMetrics(
            () => {
                return this.performAllFVAs(input)
                    .then(() => {
                        const params: ScanCommandInput = {
                            TableName: HISTORY_TABLE,
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

                        return scanUntilLimit<HistorySchema>(this.client, params, input.limit ?? DEFAULT_PAGE_SIZE)
                    })
            },
            ListHistory.NAME, this.metrics
        )
    }

    private performAllFVAs(input: ListHistoryInput): Promise<void> {
        return new Promise((resolve, reject) => {
            if (input.borrower == undefined) {
                reject(new Error("Missing required field 'borrower'"))
            }
            resolve()
        })
    }
}

export interface ListHistoryInput {
    borrower?: string,
    limit?: number,
    pageToken?: string
}

export interface ListHistoryResult {
    items: HistorySchema[],
    nextPageToken?: string
}
