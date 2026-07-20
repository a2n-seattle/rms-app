import { TagTable } from "../db/TagTable"
import { TransactionsTable } from "../db/TransactionsTable"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"

/**
 * Update tags of item family
 */
export class UpdateTags {
    public static NAME: string = "update tags"

    private readonly tagTable: TagTable
    private readonly transactionsTable: TransactionsTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.tagTable = new TagTable(client)
        this.transactionsTable = new TransactionsTable(client)
        this.metrics = metrics
    }

    public router(number: string, request: string, scratch?: UpdateTagsInput): string | Promise<string> {
        if (scratch === undefined) {
            return this.transactionsTable.create(number, UpdateTags.NAME)
                .then(() => "Name of item:")
        } else if (scratch.name === undefined) {
            return this.transactionsTable.appendToScratch(number, "name", request)
                .then(() => "New Tags (separated by spaces):")
        } else {
            scratch.tags = request.split(/(\s+)/)
                .filter((str: string) => str.trim().length > 0)
                .map((str: string) => str.toLowerCase().trim())
            return this.transactionsTable.delete(number)
                .then(() => this.execute(scratch))
        }
    }

    /**
     * Required params for scratch object:
     * @param name Name of item
     * @param tags New tags
     */
    public execute(input: UpdateTagsInput): Promise<string> {
        return emitAPIMetrics(
            () => {
                return this.performAllFVAs(input)
                    .then(() => this.tagTable.update(input.name, input.tags))
                    .then(() => `Successfully updated tags for '${input.name}'`)
            },
            UpdateTags.NAME, this.metrics
        )
    }
    private performAllFVAs(input: UpdateTagsInput): Promise<void> {
        return new Promise((resolve, reject) => {
            if (input.name == undefined) {
                reject(new Error("Missing required field 'name'"))
            } else if (input.tags == undefined) {
                reject(new Error("Missing required field 'tags'"))
            }
            resolve()
        })
    }
}

export interface UpdateTagsInput {
    name?: string
    tags?: string[]
}