import { ScheduleTable } from "../db/ScheduleTable"
import { TransactionsTable } from "../db/TransactionsTable"
import { ScheduleSchema } from "../db/Schemas"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"

/**
 * Get reservation by id.
 */
export class GetReservation {
    public static NAME: string = "get reservation"

    private readonly scheduleTable: ScheduleTable
    private readonly transactionsTable: TransactionsTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.scheduleTable = new ScheduleTable(client)
        this.transactionsTable = new TransactionsTable(client)
        this.metrics = metrics
    }

    public router(number: string, request: string, scratch?: GetReservationInput): string | Promise<string> {
        if (scratch === undefined) {
            return this.transactionsTable.create(number, GetReservation.NAME)
                .then(() => "ID of reservation:")
        } else {
            scratch.id = request
            return this.transactionsTable.delete(number)
                    .then(() => this.execute(scratch))
                    .then((ret: ScheduleSchema) => {
                        return formatSchedule(ret)
                    })
        }
    }

    /**
     * Required params in scratch object:
     * @param id ID of reservation
     */
    public execute(scratch: GetReservationInput): Promise<ScheduleSchema> {
        return emitAPIMetrics(
            () => {
                return this.performAllFVAs(scratch)
                    .then(() => this.scheduleTable.get(scratch.id))
                    .then((ret: ScheduleSchema) => {
                        if (ret !== undefined) {
                            return ret
                        } else {
                            throw Error(`Reservation not found. id: '${scratch.id}' is invalid`)
                        }
                    })
            },
            GetReservation.NAME, this.metrics
        )
    }

    private performAllFVAs(scratch: GetReservationInput): Promise<void> {
        return new Promise((resolve, reject) => {
            if (scratch.id == undefined) {
                reject(new Error("Missing required field 'id'"))
            }
            resolve()
        })
    }
}

interface GetReservationInput{
    id?: string
}

// Output Formatting Functions. Exporting them to be used for testing.

export function formatSchedule(entry: ScheduleSchema) {
    return `\n  id: ${entry.id}`
        + `\n    borrower: ${entry.borrower}`
        + `\n    itemIds: ${entry.itemIds.toString()}`
        + `\n    startTime: ${entry.startTime}`
        + `\n    endTime: ${entry.endTime}`
        + `\n    notes: ${entry.notes}`
}