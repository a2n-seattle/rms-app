import { ScheduleTable } from "../db/ScheduleTable"
import { ScheduleSchema } from "../db/Schemas"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"

/**
 * Lists a borrower's reservations that haven't started yet ("upcoming" -
 * not yet consumed via BorrowFromSchedule), paginated. Reuses
 * ScheduleTable.listByBorrower (id-array-driven via UserTable.reserved, see GH-384),
 * passing startTime >= now as the predicate so a page reliably returns up to `limit` real
 * upcoming reservations rather than a short page requiring the caller to filter further.
 */
export class ListUpcomingReservations {
    public static NAME: string = "list upcoming reservations"

    private readonly scheduleTable: ScheduleTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.scheduleTable = new ScheduleTable(client)
        this.metrics = metrics
    }

    public execute(input: ListUpcomingReservationsInput): Promise<ListUpcomingReservationsResult> {
        return emitAPIMetrics(
            () => {
                return this.performAllFVAs(input)
                    .then(() => this.scheduleTable.listByBorrower(
                        input.borrower,
                        input.limit,
                        input.pageToken,
                        (schedule: ScheduleSchema) => schedule.startTime >= Date.now()
                    ))
            },
            ListUpcomingReservations.NAME, this.metrics
        )
    }

    private performAllFVAs(input: ListUpcomingReservationsInput): Promise<void> {
        return new Promise((resolve, reject) => {
            if (input.borrower == undefined) {
                reject(new Error("Missing required field 'borrower'"))
            }
            resolve()
        })
    }
}

export interface ListUpcomingReservationsInput {
    borrower?: string,
    limit?: number,
    pageToken?: string
}

export interface ListUpcomingReservationsResult {
    items: ScheduleSchema[],
    nextPageToken?: string
}
