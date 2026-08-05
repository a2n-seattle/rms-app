import { BATCH_TABLE, BatchSchema } from "../db/Schemas"
import { encodePageToken, decodePageToken } from "../db/PageToken"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"
import { ScanCommandInput, ScanCommandOutput } from "@aws-sdk/lib-dynamodb"

const DEFAULT_PAGE_SIZE = 25

/**
 * Lists every batch (unfiltered "browse everything"), paginated. Same
 * plain-Scan shape as ListItems - no query, acceptable at RMS's current
 * scale.
 */
export class ListBatches {
    public static NAME: string = "list batches"

    private readonly client: DBClient
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.client = client
        this.metrics = metrics
    }

    public execute(input: ListBatchesInput): Promise<ListBatchesResult> {
        return emitAPIMetrics(
            () => {
                const params: ScanCommandInput = {
                    TableName: BATCH_TABLE,
                    Limit: input.limit ?? DEFAULT_PAGE_SIZE,
                    ...(input.pageToken ? { ExclusiveStartKey: decodePageToken(input.pageToken) } : {})
                }

                return this.client.scan(params)
                    .then((output: ScanCommandOutput) => ({
                        items: (output.Items ?? []) as BatchSchema[],
                        nextPageToken: output.LastEvaluatedKey ? encodePageToken(output.LastEvaluatedKey) : undefined
                    }))
            },
            ListBatches.NAME, this.metrics
        )
    }
}

export interface ListBatchesInput {
    limit?: number,
    pageToken?: string
}

export interface ListBatchesResult {
    items: BatchSchema[],
    nextPageToken?: string
}
