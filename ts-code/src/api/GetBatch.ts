import { MainTable } from "../db/MainTable"
import { ItemTable } from "../db/ItemTable"
import { BatchTable } from "../db/BatchTable"
import { TransactionsTable } from "../db/TransactionsTable"
import { ItemsSchema, MainSchema, BatchSchema } from "../db/Schemas"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { UserDirectoryClient } from "../injection/cognito/UserDirectoryClient"
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
    private readonly userDirectory?: UserDirectoryClient

    public constructor(client: DBClient, metrics?: MetricsClient, userDirectory?: UserDirectoryClient) {
        this.mainTable = new MainTable(client)
        this.itemTable = new ItemTable(client)
        this.batchTable = new BatchTable(client)
        this.transactionsTable = new TransactionsTable(client)
        this.metrics = metrics
        this.userDirectory = userDirectory
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
                                    return this.mainTable.get(itemEntry.familyId)
                                        .then((mainEntry: MainSchema) => getBatchItem(id, mainEntry.name, mainEntry.owner, itemEntry.borrower))
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

    /**
     * Same as execute(), but enriches each item ID in the batch with its
     * display name, owner, and borrower - the structured equivalent of
     * what router() formats into a string, for API/browse consumers that
     * need JSON rather than human-readable text. When a UserDirectoryClient
     * was injected, also resolves owner/borrower to a Cognito display name
     * (GH-353/GH-358), same pattern as GetItem.buildReturnObject.
     */
    public executeDetailed(scratch: ScratchInterface): Promise<GetBatchDetailedEntry[]> {
        return this.execute(scratch)
            .then((ids: string[]) => {
                return Promise.all(ids.map((id: string) => {
                    return this.itemTable.get(id)
                        .then((itemEntry: ItemsSchema) => {
                            return this.mainTable.get(itemEntry.familyId)
                                .then((mainEntry: MainSchema) => this.buildDetailedEntry(id, mainEntry, itemEntry))
                        })
                }))
            })
    }

    private buildDetailedEntry(id: string, mainEntry: MainSchema, itemEntry: ItemsSchema): Promise<GetBatchDetailedEntry> {
        const base: GetBatchDetailedEntry = {
            id,
            name: mainEntry.name,
            owner: mainEntry.owner,
            borrower: itemEntry.borrower
        }
        if (!this.userDirectory) {
            return Promise.resolve(base)
        }
        const ownerDisplayNamePromise = mainEntry.ownerId
            ? this.userDirectory.findBySub(mainEntry.ownerId).then((u) => u?.name ?? u?.email)
            : Promise.resolve(undefined)
        const borrowerDisplayNamePromise = itemEntry.borrower
            ? this.userDirectory.findBySub(itemEntry.borrower).then((u) => u?.name ?? u?.email)
            : Promise.resolve(undefined)
        return Promise.all([ownerDisplayNamePromise, borrowerDisplayNamePromise])
            .then(([ownerDisplayName, borrowerDisplayName]) => ({ ...base, ownerDisplayName, borrowerDisplayName }))
    }
}

interface ScratchInterface {
    name?: string
}

export interface GetBatchDetailedEntry {
    id: string,
    name: string,
    owner: string,
    borrower: string,
    /** Resolved Cognito display name for `owner`'s ownerId, when a UserDirectoryClient was injected. */
    ownerDisplayName?: string,
    /** Resolved Cognito display name for `borrower`, when a UserDirectoryClient was injected. */
    borrowerDisplayName?: string
}

export function getBatchItem(id: string, name: string, owner: string, borrower: string): string {
    return `\n  id: ${id}`
        + `\n    name: ${name}`
        + `\n    owner: ${owner}`
        + `\n    borrower: ${borrower}`
}