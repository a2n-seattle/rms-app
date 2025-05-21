import { ScheduleTable } from "../db/ScheduleTable"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"
import { ItemTable } from "../db/ItemTable"

export class BorrowFromSchedule {
    public static NAME: string = "borrow from schedule"

    private readonly scheduleTable: ScheduleTable
    private readonly itemTable: ItemTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.scheduleTable = new ScheduleTable(client)
        this.itemTable = new ItemTable(client)
        this.metrics = metrics
    }

    /**
     * Required params in scratch object:
     * @param scheduleId schedule ID
     * @param notes Notes about this action
     * 
     * @returns Promise that resolves to a string indicating success or failure
     * @throws Error if schedule ID is not found
     */
    public execute(input: BorrowFromScheduleInput): Promise<string> {
        return emitAPIMetrics(
            () => {
                return this.performAllFVAs(input)
                    .then(() => this.scheduleTable.get(input.scheduleId))
                    .then((schedule) => {
                        if (schedule == undefined) {
                            throw new Error(`Reservation not found. id: '${input.scheduleId}' is invalid`)
                        }
                        schedule.itemIds.map((id: string) =>
                            this.itemTable.changeBorrower(id, schedule.borrower, "borrow", input.notes)
                        )
                    }).then(() => this.scheduleTable.delete(input.scheduleId))
                    .then(() => {
                        return `Successfully borrowed items from schedule '${input.scheduleId}'.`
                    });
            },
            BorrowFromSchedule.NAME, this.metrics
        );
    }

    // /**
    //  * Validate that the schedule ID is not undefined
    //  *
    //  * @returns Promise that resolves to true if the schedule ID exists, rejects otherwise
    //  */
    private performAllFVAs(input: BorrowFromScheduleInput): Promise<void> {
        return new Promise((resolve, reject) => {
            if (input.scheduleId == undefined) {
                reject(new Error("Missing required field 'scheduleId'."))
            }
            resolve()
        })
    }
}

export interface BorrowFromScheduleInput {
    scheduleId?: string,
    notes?: string
}