import { MAIN_TABLE, MainSchema } from "../db/Schemas"
import { encodePageToken, decodePageToken } from "../db/PageToken"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"
import { ScanCommandInput, ScanCommandOutput } from "@aws-sdk/lib-dynamodb"

const DEFAULT_PAGE_SIZE = 25

/**
 * Lists every item type (unfiltered "browse everything"), paginated.
 * Unlike SearchItem (tag-driven), this has no query - a plain Scan across
 * MainTable, acceptable at RMS's current scale.
 */
export class ListItems {
    public static NAME: string = "list items"

    private readonly client: DBClient
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.client = client
        this.metrics = metrics
    }

    public execute(input: ListItemsInput): Promise<ListItemsResult> {
        return emitAPIMetrics(
            () => {
                const params: ScanCommandInput = {
                    TableName: MAIN_TABLE,
                    Limit: input.limit ?? DEFAULT_PAGE_SIZE,
                    ...(input.pageToken ? { ExclusiveStartKey: decodePageToken(input.pageToken) } : {})
                }

                return this.client.scan(params)
                    .then((output: ScanCommandOutput) => ({
                        items: (output.Items ?? []) as MainSchema[],
                        nextPageToken: output.LastEvaluatedKey ? encodePageToken(output.LastEvaluatedKey) : undefined
                    }))
            },
            ListItems.NAME, this.metrics
        )
    }
}

export interface ListItemsInput {
    limit?: number,
    pageToken?: string
}

export interface ListItemsResult {
    items: MainSchema[],
    nextPageToken?: string
}
