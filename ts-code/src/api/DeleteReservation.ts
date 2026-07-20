import { ScheduleTable } from "../db/ScheduleTable"
import { TransactionsTable } from "../db/TransactionsTable"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"

/**
 * Deletes specified reservation
 */
export class DeleteReservation {
    public static NAME: string = "delete reservation"

    private readonly scheduleTable: ScheduleTable
    private readonly transactionsTable: TransactionsTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.scheduleTable = new ScheduleTable(client)
        this.transactionsTable = new TransactionsTable(client)
        this.metrics = metrics
    }

    public router(number: string, request: string, scratch?: DeleteReservationInput): string | Promise<string> {
        if (scratch === undefined) {
            return this.transactionsTable.create(number, DeleteReservation.NAME)
                .then(() => "ID of reservation:")
        } else {
            scratch.id = request
            return this.transactionsTable.delete(number)
                .then(() => this.execute(scratch))
        }
    }

    /**
     * Required params in scratch object:
     * @param id ID of reservation
     */
    public execute(input: DeleteReservationInput): Promise<string> {
        return emitAPIMetrics(
            () => {
                    return this.performAllFVAs(input)
                        .then(() => {
                            return this.scheduleTable.delete(input.id)
                        })
                        .then(() => `Successfully deleted reservation '${input.id.toString()}'.`)
            },
            DeleteReservation.NAME, this.metrics
        )
    }

    private performAllFVAs(input: DeleteReservationInput): Promise<void> {
        return new Promise((resolve, reject) => {
            if (input.id == undefined) {
                reject(new Error("Missing required field 'id'"))
            }
            resolve()
        })
    }
}

export interface DeleteReservationInput {
    id?: string
}