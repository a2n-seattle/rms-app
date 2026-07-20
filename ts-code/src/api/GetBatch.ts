import { MainTable } from "../db/MainTable"
import { ItemTable } from "../db/ItemTable"
import { BatchTable } from "../db/BatchTable"
import { TransactionsTable } from "../db/TransactionsTable"
import { ItemsSchema, MainSchema, BatchSchema } from "../db/Schemas"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"

/**
 * Get List of Items from Batch ID
 */
export class GetBatch {
    public static NAME: string = "get batch"

    private readonly mainTable: MainTable
    private readonly itemTable: ItemTable
    private readonly batchTable: BatchTable
    private readonly transactionsTable: TransactionsTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.mainTable = new MainTable(client)
        this.itemTable = new ItemTable(client)
        this.batchTable = new BatchTable(client)
        this.transactionsTable = new TransactionsTable(client)
        this.metrics = metrics
    }

    public router(number: string, request: string, scratch?: ScratchInterface): string | Promise<string> {
        if (scratch === undefined) {
            return this.transactionsTable.create(number, GetBatch.NAME)
                .then(() => "Name of Batch:")
        } else {
            scratch.name = request
            return this.transactionsTable.delete(number)
                    .then(() => this.execute(scratch))
                    .then((ids: string[]) => {
                        return Promise.all(ids.map((id: string) => {
                            return this.itemTable.get(id)
                                .then((itemEntry: ItemsSchema) => {
                                    return this.mainTable.get(itemEntry.name)
                                        .then((mainEntry: MainSchema) => getBatchItem(id, mainEntry.displayName, itemEntry.owner, itemEntry.borrower))
                                })
                        })).then((items: string[]) => `batch: ${scratch.name}` + items.join(""))
                    })
                    
        }
    }

    /**
     * Required params in scratch object:
     * @param name Name of Batch
     */
    public execute(scratch: ScratchInterface): Promise<string[]> {
        return emitAPIMetrics(
            () => {
                return this.batchTable.get(scratch.name)
                    .then((batchEntry: BatchSchema) => {
                        if (batchEntry) {
                            return batchEntry.val
                        } else {
                            throw new Error(`Unable to find Batch '${scratch.name}'`)
                        }
                    })
            },
            GetBatch.NAME, this.metrics
        )
    }
}

interface ScratchInterface {
    name?: string
}

export function getBatchItem(id: string, name: string, owner: string, borrower: string): string {
    return `\n  id: ${id}`
        + `\n    name: ${name}`
        + `\n    owner: ${owner}`
        + `\n    borrower: ${borrower}`
}