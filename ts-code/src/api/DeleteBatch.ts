import { BatchTable } from "../db/BatchTable"
import { TransactionsTable } from "../db/TransactionsTable"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"

/**
 * Delete Batch
 */
export class DeleteBatch {
    public static NAME: string = "delete batch"

    private readonly batchTable: BatchTable
    private readonly transactionsTable: TransactionsTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.batchTable = new BatchTable(client)
        this.transactionsTable = new TransactionsTable(client)
        this.metrics = metrics
    }

    public router(number: string, request: string, scratch?: DeleteBatchInput): string | Promise<string> {
        if (scratch === undefined) {
            return this.transactionsTable.create(number, DeleteBatch.NAME)
                .then(() => "Name of Batch:")
        } else if (scratch.name === undefined) {
            return this.transactionsTable.appendToScratch(number, "name", request)
                .then(() => `Type 'y' to confirm that you want to delete batch: '${request}'`)
        } else {
            if (request === "y") {
                return this.transactionsTable.delete(number)
                    .then(() => this.execute(scratch))
            } else {
                return "ERROR: Didn't receive 'y'. Please reply again with a 'y' to proceed with deleting the object, or 'abort' to abort the transaction."
            }
        }
    }

    /**
     * Required params in scratch object:
     * @param name Name of batch
     */
    public execute(input: DeleteBatchInput): Promise<string> {
        return emitAPIMetrics(
            () => {
                return this.performAllFVAs(input)
                    .then(() => this.batchTable.delete(input.name))
                    .then(() => `Successfully deleted batch '${input.name}'`)
            },
            DeleteBatch.NAME, this.metrics
        )
    }
    private performAllFVAs(input: DeleteBatchInput): Promise<void> {
        return new Promise((resolve, reject) => {
            if (input.name == undefined) {
                reject(new Error("Missing required field 'name'"))
            }
            resolve()
        })
    }
}

export interface DeleteBatchInput {
    name?: string
}