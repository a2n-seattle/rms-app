import { ItemsSchema, ScheduleSchema } from "../db/Schemas"
import { getUntilLimit } from "../db/getUntilLimit"
import { ItemTable } from "../db/ItemTable"
import { UserTable } from "../db/UserTable"
import { ScheduleTable } from "../db/ScheduleTable"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"

const DEFAULT_PAGE_SIZE = 25

/**
 * Lists currently-borrowed items that are overdue for a given borrower, sourced from
 * UserTable.borrowed rather than a full ItemsTable Scan (see GH-384). ItemsSchema has no
 * due-date field of its own, so "overdue" is defined here as: at least one of the item's
 * `schedule` entries (its reservation history/associations) is a ScheduleSchema whose
 * endTime has already passed. Filtering happens in getUntilLimit's predicate, so a match
 * beyond the first slice of `borrowed` is still found rather than silently dropped.
 */
export class ListOverdueItems {
    public static NAME: string = "list overdue items"

    private readonly itemTable: ItemTable
    private readonly userTable: UserTable
    private readonly scheduleTable: ScheduleTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.itemTable = new ItemTable(client)
        this.userTable = new UserTable(client)
        this.scheduleTable = new ScheduleTable(client)
        this.metrics = metrics
    }

    public execute(input: ListOverdueItemsInput): Promise<ListOverdueItemsResult> {
        return emitAPIMetrics(
            () => {
                return this.performAllFVAs(input)
                    .then(() => this.userTable.get(input.borrower))
                    .then((user) => getUntilLimit<ItemsSchema>(
                        user?.borrowed ?? [],
                        (id) => this.itemTable.get(id),
                        input.limit ?? DEFAULT_PAGE_SIZE,
                        input.pageToken,
                        (item) => this.isOverdue(item)
                    ))
            },
            ListOverdueItems.NAME, this.metrics
        )
    }

    private isOverdue(item: ItemsSchema): Promise<boolean> {
        const now: number = Date.now()
        return Promise.all(item.schedule.map((scheduleId: string) => this.scheduleTable.get(scheduleId)))
            .then((schedules: ScheduleSchema[]) => schedules.some((schedule) => schedule && schedule.endTime < now))
    }

    private performAllFVAs(input: ListOverdueItemsInput): Promise<void> {
        return new Promise((resolve, reject) => {
            if (input.borrower == undefined) {
                reject(new Error("Missing required field 'borrower'"))
            }
            resolve()
        })
    }
}

export interface ListOverdueItemsInput {
    borrower?: string,
    limit?: number,
    pageToken?: string
}

export interface ListOverdueItemsResult {
    items: ItemsSchema[],
    nextPageToken?: string
}
