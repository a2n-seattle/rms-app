import { MainSchema } from "../db/Schemas"
import { getUntilLimit } from "../db/getUntilLimit"
import { MainTable } from "../db/MainTable"
import { UserTable } from "../db/UserTable"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"

const DEFAULT_PAGE_SIZE = 25

/**
 * Lists item types owned by a given Cognito user, sourced from UserTable.owned (a
 * denormalized index maintained by AddItem/DeleteItem) rather than a full MainTable Scan --
 * see GH-384.
 *
 * Items whose owner never resolved to a real Cognito user (a room, "the
 * church", etc. -- `ownerId` left unset) never show up here.
 */
export class ListMyOwnedItems {
    public static NAME: string = "list my owned items"

    private readonly mainTable: MainTable
    private readonly userTable: UserTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.mainTable = new MainTable(client)
        this.userTable = new UserTable(client)
        this.metrics = metrics
    }

    public execute(input: ListMyOwnedItemsInput): Promise<ListMyOwnedItemsResult> {
        return emitAPIMetrics(
            () => {
                return this.performAllFVAs(input)
                    .then(() => this.userTable.get(input.ownerId))
                    .then((user) => getUntilLimit<MainSchema>(
                        user?.owned ?? [],
                        (id) => this.mainTable.get(id),
                        input.limit ?? DEFAULT_PAGE_SIZE,
                        input.pageToken
                    ))
            },
            ListMyOwnedItems.NAME, this.metrics
        )
    }

    private performAllFVAs(input: ListMyOwnedItemsInput): Promise<void> {
        return new Promise((resolve, reject) => {
            if (input.ownerId == undefined) {
                reject(new Error("Missing required field 'ownerId'"))
            }
            resolve()
        })
    }
}

export interface ListMyOwnedItemsInput {
    ownerId?: string,
    limit?: number,
    pageToken?: string
}

export interface ListMyOwnedItemsResult {
    items: MainSchema[],
    nextPageToken?: string
}
