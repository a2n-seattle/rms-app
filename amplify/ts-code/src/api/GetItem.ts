import { MainTable } from "../db/MainTable"
import { ItemTable } from "../db/ItemTable"
import { TransactionsTable } from "../db/TransactionsTable"
import { MainSchema, ItemsSchema } from "../db/Schemas"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"

/**
 * Get Item either by id or by name.
 */
export class GetItem {
    public static NAME: string = "get item"

    private readonly mainTable: MainTable
    private readonly itemTable: ItemTable
    private readonly transactionsTable: TransactionsTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.mainTable = new MainTable(client)
        this.itemTable = new ItemTable(client)
        this.transactionsTable = new TransactionsTable(client)
        this.metrics = metrics
    }

    public router(number: string, request: string, scratch?: ScratchInterface): string | Promise<string> {
        if (scratch === undefined) {
            return this.transactionsTable.create(number, GetItem.NAME)
                .then(() => "Name or ID of item:")
        } else {
            scratch.key = request
            return this.transactionsTable.delete(number)
                    .then(() => this.execute(scratch))
                    .then((ret: ReturnObject) => {
                        let returnString = getItemHeader(ret.main)
                        ret.items?.forEach((item: ItemsSchema) => returnString += getItemItem(item))
                        return returnString
                    })
        }
    }

    /**
     * Required params in scratch object:
     * @param key Name or ID of item
     */
    public execute(scratch: ScratchInterface): Promise<ReturnObject> {
        return emitAPIMetrics(
            () => {
                return this.itemTable.get(scratch.key)
                    .then((itemEntry: ItemsSchema) => {
                        if (itemEntry) {
                            return this.mainTable.get(itemEntry.name)
                                .then((entry: MainSchema) => {
                                    return new ReturnObject(entry, [itemEntry])
                                })
                        } else {
                            return this.mainTable.get(scratch.key)
                                .then((entry: MainSchema) => {
                                    if (entry) {
                                        return Promise.all(entry.items?.map((id: string) => this.itemTable.get(id)))
                                            .then((items: ItemsSchema[]) => new ReturnObject(entry, items))
                                    } else {
                                        throw Error(`Couldn't find item '${scratch.key}'`)
                                    }
                                })
                        }
                    })
            },
            GetItem.NAME, this.metrics
        )
    }
}

export class ReturnObject {
    readonly main: MainSchema
    readonly items: ItemsSchema[]

    constructor(main: MainSchema, items: ItemsSchema[]) {
        this.main = main
        this.items = items
    }
}

interface ScratchInterface {
    key?: string
}

// Output Formatting Functions. Exporting them to be used for testing.

export function getItemHeader(entry: MainSchema): string {
    return `id: ${entry.id}`
        + `\ndisplayName: ${entry.displayName}`
        + `\ndescription: ${entry.description}`
        + `\ntags: ${entry.tags.toString()}`
        + `\nitems:`
}

export function getItemItem(entry: ItemsSchema) {
    return `\n    id: ${entry.id}`
        + `\n    name: ${entry.name}`
        + `\n    itemName: ${entry.itemName}`
        + `\n    owner: ${entry.owner}`
        + `\n    location: ${entry.location}`
        + `\n    borrower: ${entry.borrower}`
        + `\n    batch: ${entry.batch.toString()}`
        + `\n    notes: ${entry.notes}`
}