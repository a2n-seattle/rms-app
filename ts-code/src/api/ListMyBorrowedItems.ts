import { ItemsSchema } from "../db/Schemas"
import { getUntilLimit } from "../db/getUntilLimit"
import { ItemTable } from "../db/ItemTable"
import { UserTable } from "../db/UserTable"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"

const DEFAULT_PAGE_SIZE = 25

/**
 * Lists items currently borrowed by a given borrower, sourced from
 * UserTable.borrowed (a denormalized index maintained by BorrowItem/ReturnItem/
 * BorrowFromSchedule) rather than a full ItemsTable Scan -- see GH-384.
 */
export class ListMyBorrowedItems {
    public static NAME: string = "list my borrowed items"

    private readonly itemTable: ItemTable
    private readonly userTable: UserTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.itemTable = new ItemTable(client)
        this.userTable = new UserTable(client)
        this.metrics = metrics
    }

    public execute(input: ListMyBorrowedItemsInput): Promise<ListMyBorrowedItemsResult> {
        return emitAPIMetrics(
            () => {
                return this.performAllFVAs(input)
                    .then(() => this.userTable.get(input.borrower))
                    .then((user) => getUntilLimit<ItemsSchema>(
                        user?.borrowed ?? [],
                        (id) => this.itemTable.get(id),
                        input.limit ?? DEFAULT_PAGE_SIZE,
                        input.pageToken
                    ))
            },
            ListMyBorrowedItems.NAME, this.metrics
        )
    }

    private performAllFVAs(input: ListMyBorrowedItemsInput): Promise<void> {
        return new Promise((resolve, reject) => {
            if (input.borrower == undefined) {
                reject(new Error("Missing required field 'borrower'"))
            }
            resolve()
        })
    }
}

export interface ListMyBorrowedItemsInput {
    borrower?: string,
    limit?: number,
    pageToken?: string
}

export interface ListMyBorrowedItemsResult {
    items: ItemsSchema[],
    nextPageToken?: string
}
