import { MainTable } from "../db/MainTable"
import { ItemTable } from "../db/ItemTable"
import { TagTable } from "../db/TagTable"
import { TransactionsTable } from "../db/TransactionsTable"
import { MainSchema } from "../db/Schemas"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"

/**
 * Deletes item from item inventory table.
 */
export class DeleteItem {
    public static NAME: string = "delete item"

    private readonly mainTable: MainTable
    private readonly itemTable: ItemTable
    private readonly tagTable: TagTable
    private readonly transactionsTable: TransactionsTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.mainTable = new MainTable(client)
        this.itemTable = new ItemTable(client)
        this.tagTable = new TagTable(client)
        this.transactionsTable = new TransactionsTable(client)
        this.metrics = metrics
    }

    public router(number: string, request: string, scratch?: DeleteItemInput): string | Promise<string> {
        if (scratch === undefined) {
            return this.transactionsTable.create(number, DeleteItem.NAME)
                .then(() => "ID of item:")
        } else if (scratch.id === undefined) {
            return this.transactionsTable.appendToScratch(number, "id", request)
                .then(() => `Type 'y' to confirm that you want to delete item: '${request}'`)
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
     * @param id ID of Item
     */
    public execute(input: DeleteItemInput): Promise<string> {
        return emitAPIMetrics(
            () => {
                return this.performAllFVAs(input)
                    .then(() => this.itemTable.delete(input.id))
                    .then((name: string) => this.mainTable.get(name))
                    .then((entry: MainSchema) => {
                        if (entry.items.length == 0) {
                            return this.tagTable.delete(entry.id, entry.tags)
                                .then(() => this.mainTable.delete(entry.id))
                                .then(() => entry.id)
                        } else {
                            return entry.id
                        }
                    })
                    .then((name: string) => `Deleted a '${name}' from the inventory.`)
            },
            DeleteItem.NAME, this.metrics
        )
    }
    private performAllFVAs(input: DeleteItemInput): Promise<void> {
        return new Promise((resolve, reject) => {
            if (input.id == undefined) {
                reject(new Error("Missing required field 'id'"))
            }
            resolve()
        })
    }
}

export interface DeleteItemInput {
    id?: string
}