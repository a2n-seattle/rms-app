import { ItemsSchema } from "../db/Schemas"
import { ItemTable } from "../db/ItemTable"
import { ScheduleTable } from "../db/ScheduleTable"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"

/**
 * Looks up every currently-borrowed item sharing a borrowGroupId -- i.e.
 * everything borrowed together via a single BorrowFromSchedule call -- so
 * the batched return flow can pull up a confirmation page listing the
 * whole group instead of just one item.
 *
 * borrowGroupId is the id of the ScheduleTable reservation that was
 * consumed to create the borrow (ScheduleTable.consume, called by
 * BorrowFromSchedule instead of delete specifically so this row survives
 * to be looked up here) -- read its itemIds directly rather than scanning
 * ItemsTable (see GH-389). An item that's since been individually
 * returned has its borrowGroupId cleared (ItemTable.changeBorrower's
 * "return" action), so fetched items are still filtered on borrowGroupId
 * to correctly support partial returns.
 */
export class GetBorrowGroup {
    public static NAME: string = "get borrow group"

    private readonly itemTable: ItemTable
    private readonly scheduleTable: ScheduleTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.itemTable = new ItemTable(client)
        this.scheduleTable = new ScheduleTable(client)
        this.metrics = metrics
    }

    public execute(input: GetBorrowGroupInput): Promise<GetBorrowGroupResult> {
        return emitAPIMetrics(
            () => {
                return this.performAllFVAs(input)
                    .then(() => this.scheduleTable.get(input.borrowGroupId))
                    .then((schedule) => Promise.all((schedule?.itemIds ?? []).map((id: string) => this.itemTable.get(id))))
                    .then((items) => ({
                        items: items.filter((item): item is ItemsSchema =>
                            item !== undefined && item.borrowGroupId === input.borrowGroupId)
                    }))
            },
            GetBorrowGroup.NAME, this.metrics
        )
    }

    private performAllFVAs(input: GetBorrowGroupInput): Promise<void> {
        return new Promise((resolve, reject) => {
            if (input.borrowGroupId == undefined) {
                reject(new Error("Missing required field 'borrowGroupId'"))
            }
            resolve()
        })
    }
}

export interface GetBorrowGroupInput {
    borrowGroupId?: string
}

export interface GetBorrowGroupResult {
    items: ItemsSchema[]
}
