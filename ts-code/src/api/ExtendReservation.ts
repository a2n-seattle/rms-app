import { ScheduleTable } from "../db/ScheduleTable"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"

/**
 * Extends an existing reservation's endTime in place, preserving its id.
 * Reuses ScheduleTable's overlap validation (the same check
 * CreateReservation goes through) against every *other* reservation on the
 * same item(s), excluding the reservation being extended itself -- see
 * ScheduleTable.updateEndTime.
 */
export class ExtendReservation {
    public static NAME: string = "extend reservation"

    private readonly scheduleTable: ScheduleTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.scheduleTable = new ScheduleTable(client)
        this.metrics = metrics
    }

    /**
     * Required params in scratch object:
     * @param id ID of reservation to extend
     * @param newEndTime New end time of reservation
     */
    public execute(input: ExtendReservationInput): Promise<string> {
        return emitAPIMetrics(
            () => {
                return this.performAllFVAs(input)
                    .then(() => this.scheduleTable.updateEndTime(input.id, input.newEndTime))
            },
            ExtendReservation.NAME, this.metrics
        )
    }

    private performAllFVAs(input: ExtendReservationInput): Promise<void> {
        return new Promise((resolve, reject) => {
            if (input.id == undefined) {
                reject(new Error("Missing required field 'id'"))
            } else if (input.newEndTime == undefined) {
                reject(new Error("Missing required field 'newEndTime'"))
            } else if (Number.isNaN(new Date(input.newEndTime).getTime())) {
                reject(new Error(`Date format incorrect for 'newEndTime' ${input.newEndTime}`))
            }
            resolve()
        })
    }
}

export interface ExtendReservationInput {
    id?: string,
    newEndTime?: number
}
