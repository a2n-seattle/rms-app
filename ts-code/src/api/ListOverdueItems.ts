import { ITEMS_TABLE, ItemsSchema, ScheduleSchema } from "../db/Schemas"
import { decodePageToken } from "../db/PageToken"
import { scanUntilLimit } from "../db/scanUntilLimit"
import { ScheduleTable } from "../db/ScheduleTable"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"
import { ScanCommandInput } from "@aws-sdk/lib-dynamodb"

const DEFAULT_PAGE_SIZE = 25

/**
 * Lists currently-borrowed items that are overdue for a given borrower,
 * paginated. ItemsSchema has no due-date field of its own, so "overdue"
 * is defined here as: borrower matches, and at least one of the item's
 * `schedule` entries (its reservation history/associations) is a
 * ScheduleSchema whose endTime has already passed. Scans ItemsSchema
 * unfiltered (no single-equality FilterExpression covers "borrower is
 * this borrower AND some linked schedule is overdue" in one pass); the
 * borrower+overdue check happens in scanUntilLimit's predicate instead
 * (see db/scanUntilLimit.ts), so a match beyond the first raw scanned page
 * is still found rather than silently dropped.
 */
export class ListOverdueItems {
    public static NAME: string = "list overdue items"

    private readonly client: DBClient
    private readonly scheduleTable: ScheduleTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.client = client
        this.scheduleTable = new ScheduleTable(client)
        this.metrics = metrics
    }

    public execute(input: ListOverdueItemsInput): Promise<ListOverdueItemsResult> {
        return emitAPIMetrics(
            () => {
                return this.performAllFVAs(input)
                    .then(() => {
                        const params: ScanCommandInput = {
                            TableName: ITEMS_TABLE,
                            Limit: input.limit ?? DEFAULT_PAGE_SIZE,
                            ...(input.pageToken ? { ExclusiveStartKey: decodePageToken(input.pageToken) } : {})
                        }

                        return scanUntilLimit<ItemsSchema>(
                            this.client,
                            params,
                            input.limit ?? DEFAULT_PAGE_SIZE,
                            (item) => item.borrower === input.borrower && this.isOverdue(item)
                        )
                    })
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
