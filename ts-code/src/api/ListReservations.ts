import { ScheduleTable, ListByBorrowerResult } from "../db/ScheduleTable"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"

/**
 * Lists reservations for a given borrower, paginated. See
 * ScheduleTable.listByBorrower for the pagination/filter-order caveat.
 */
export class ListReservations {
    public static NAME: string = "list reservations"

    private readonly scheduleTable: ScheduleTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.scheduleTable = new ScheduleTable(client)
        this.metrics = metrics
    }

    public execute(input: ListReservationsInput): Promise<ListByBorrowerResult> {
        return emitAPIMetrics(
            () => {
                return this.performAllFVAs(input)
                    .then(() => this.scheduleTable.listByBorrower(input.borrower, input.limit, input.pageToken))
            },
            ListReservations.NAME, this.metrics
        )
    }

    private performAllFVAs(input: ListReservationsInput): Promise<void> {
        return new Promise((resolve, reject) => {
            if (input.borrower == undefined) {
                reject(new Error("Missing required field 'borrower'"))
            }
            resolve()
        })
    }
}

export interface ListReservationsInput {
    borrower?: string,
    limit?: number,
    pageToken?: string
}
