import { ScheduleTable } from "../db/ScheduleTable"
import { ItemTable } from "../db/ItemTable"
import { TransactionsTable } from "../db/TransactionsTable"
import { ScheduleSchema } from "../db/Schemas"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"

/**
 * Creates a reservation in the schedule table.
 */
export class CreateReservation {
    public static NAME: string = "create reservation"
    private static VALID_DATE: RegExp = new RegExp(/^\d{4}(-)(((0)[0-9])|((1)[0-2]))(-)([0-2][0-9]|(3)[0-1])(-)([0-1][0-9]|(2)[0-4])(-)([0-5][0-9])$/)

    private readonly scheduleTable: ScheduleTable
    private readonly itemTable: ItemTable
    private readonly transactionsTable: TransactionsTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.scheduleTable = new ScheduleTable(client)
        this.itemTable = new ItemTable(client)
        this.transactionsTable = new TransactionsTable(client)
        this.metrics = metrics
    }

    public router(number: string, request: string, scratch?: CreateReservationInput): string | Promise<string> {
        if (scratch === undefined) {
            return this.transactionsTable.create(number, CreateReservation.NAME)
                .then(() => "IDs of Items (separated by spaces):")
        } else if (scratch.ids === undefined) {
            const ids: string[] = request.split(/(\s+)/)
                .filter((str: string) => str.trim().length > 0)
                .map((str: string) => str.toLowerCase().trim())
            return this.transactionsTable.appendToScratch(number, "ids", ids)
                .then(() => "Name of intended borrower:")
        } else if (scratch.borrower === undefined) {
            return this.transactionsTable.appendToScratch(number, "borrower", request)
                .then(() => "Start time of reservation in yyyy-mm-dd-hr-min (Ex: 2022-23-02-20-30 for 2022 Feb 23 8:30PM)")
        } else if (scratch.startTime === undefined) {
            return this.transactionsTable.appendToScratch(number, "startTime", request)
                .then(() => "End time of reservation in yyyy-mm-dd-hr-min (Ex: 2022-23-02-20-30 for 2022 Feb 23 8:30PM)")
        } else if (scratch.endTime === undefined) {
            return this.transactionsTable.appendToScratch(number, "endTime", request)
                .then(() => "Optional notes to leave about this action:")
        } else {
            scratch.notes = request
            return this.transactionsTable.delete(number)
                .then(() => this.execute(scratch))
                .then((id: string) => `Created reservation with reservation ID: ${id}`)
        }
    }

    /**
     * Required params in scratch object:
     * @param borrower Name of borrower
     * @param ids IDs of Items
     * @param startTime: string,
     * @param endTime: string,
     * @param notes Notes about this action
     */
     public execute(input: CreateReservationInput): Promise<string> {
        return emitAPIMetrics(
            () => {
                return this.performAllFVAs(input)
                .then(() => this.getUniqueId(input.ids[0].toString()))
                .then((id: string) => {
                    return this.scheduleTable
                        .create(id, input.borrower, input.ids, input.startTime, input.endTime, input.notes)
                        .then(() => id)
                })
            },
            CreateReservation.NAME, this.metrics
        )
    }

    /**
     * @private Generates random unique Id
     * @param id Random Id generator
     */
    public getUniqueId(name: string): Promise<string> {
        const curEpochMs: number = Date.now()
        const id: string = `${curEpochMs}-${name}`

        return this.scheduleTable.get(id)
            .then((item: ScheduleSchema) => {
                if (item) {
                    // Schedule ID not unique, try again
                    return this.getUniqueId(name)
                } else {
                    // Schedule ID is unique
                    return id;
                }
            })
    }

    private performAllFVAs(input: CreateReservationInput): Promise<void> {
        return new Promise((resolve, reject) => {
            if (input.borrower == undefined) {
                reject(new Error("Missing required field 'borrower'"))
            } else if (input.ids == undefined) {
                reject(new Error("Missing required field 'ids'"))
            } else if (input.startTime == undefined) {
                reject(new Error("Missing required field 'startTime'"))
            } else if (!CreateReservation.VALID_DATE.test(input.startTime)) {
                reject(new Error(`Date format incorrect for 'startTime' ${input.startTime}`))
            } else if (input.endTime == undefined) {
                reject(new Error("Missing required field 'endTime'"))
            } else if (!CreateReservation.VALID_DATE.test(input.endTime)) {
                reject(new Error(`Date format incorrect for 'endTime' ${input.endTime}`))
            }
            resolve()
        })
    }
}

export interface CreateReservationInput {
    borrower?:string,
    ids?: string[],
    startTime?: string,
    endTime?: string,
    notes?: string
}