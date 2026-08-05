import { MainTable } from "../db/MainTable"
import { ItemTable } from "../db/ItemTable"
import { TransactionsTable } from "../db/TransactionsTable"
import { MainSchema, ItemsSchema } from "../db/Schemas"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { UserDirectoryClient } from "../injection/cognito/UserDirectoryClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"

/**
 * Get Item either by id (item instance id or family id) or by family name.
 */
export class GetItem {
    public static NAME: string = "get item"

    private readonly mainTable: MainTable
    private readonly itemTable: ItemTable
    private readonly transactionsTable: TransactionsTable
    private readonly metrics?: MetricsClient
    private readonly userDirectory?: UserDirectoryClient

    public constructor(client: DBClient, metrics?: MetricsClient, userDirectory?: UserDirectoryClient) {
        this.mainTable = new MainTable(client)
        this.itemTable = new ItemTable(client)
        this.transactionsTable = new TransactionsTable(client)
        this.metrics = metrics
        this.userDirectory = userDirectory
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
     * @param key Item instance id, item family id, or item family name
     */
    public execute(scratch: ScratchInterface): Promise<ReturnObject> {
        return emitAPIMetrics(
            () => {
                return this.itemTable.get(scratch.key)
                    .then((itemEntry: ItemsSchema) => {
                        if (itemEntry) {
                            return this.mainTable.get(itemEntry.familyId)
                                .then((entry: MainSchema) => this.buildReturnObject(entry, [itemEntry]))
                        } else {
                            return this.mainTable.get(scratch.key)
                                .then((entry: MainSchema) => entry ? entry : this.mainTable.getByName(scratch.key))
                                .then((entry: MainSchema) => {
                                    if (entry) {
                                        return Promise.all(entry.items?.map((id: string) => this.itemTable.get(id)))
                                            .then((items: ItemsSchema[]) => this.buildReturnObject(entry, items))
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

    private buildReturnObject(main: MainSchema, items: ItemsSchema[]): Promise<ReturnObject> {
        if (!this.userDirectory) {
            return Promise.resolve(new ReturnObject(main, items))
        }
        const ownerDisplayNamePromise = main.ownerId
            ? this.userDirectory.findBySub(main.ownerId).then((u) => u?.name ?? u?.email)
            : Promise.resolve(undefined)
        const itemDisplayNamesPromise = Promise.all(items.map((item) =>
            item.borrower
                ? this.userDirectory.findBySub(item.borrower).then((u) => u?.name ?? u?.email)
                : Promise.resolve(undefined)
        ))
        return Promise.all([ownerDisplayNamePromise, itemDisplayNamesPromise])
            .then(([ownerDisplayName, borrowerDisplayNames]) =>
                new ReturnObject(main, items, ownerDisplayName, borrowerDisplayNames))
    }
}

export class ReturnObject {
    readonly main: MainSchema
    readonly items: ItemsSchema[]
    /** Resolved Cognito display name for `main.ownerId`, when a UserDirectoryClient was injected. */
    readonly ownerDisplayName?: string
    /** Resolved Cognito display names for each item's `borrower`, parallel to `items`. */
    readonly borrowerDisplayNames?: (string | undefined)[]

    constructor(main: MainSchema, items: ItemsSchema[], ownerDisplayName?: string, borrowerDisplayNames?: (string | undefined)[]) {
        this.main = main
        this.items = items
        this.ownerDisplayName = ownerDisplayName
        this.borrowerDisplayNames = borrowerDisplayNames
    }
}

interface ScratchInterface {
    key?: string
}

// Output Formatting Functions. Exporting them to be used for testing.

export function getItemHeader(entry: MainSchema): string {
    return `name: ${entry.name}`
        + `\ndescription: ${entry.description}`
        + `\nowner: ${entry.owner}`
        + `\nlocation: ${entry.location}`
        + `\nbatch: ${entry.batch.toString()}`
        + `\ntags: ${entry.tags.toString()}`
        + `\nitems:`
}

export function getItemItem(entry: ItemsSchema) {
    return `\n  id: ${entry.id}`
        + `\n    name: ${entry.name}`
        + `\n    borrower: ${entry.borrower}`
        + `\n    notes: ${entry.notes}`
}
