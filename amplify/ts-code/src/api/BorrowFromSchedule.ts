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
     */
    public execute(input: BorrowFromScheduleInput): Promise<string> {
        return emitAPIMetrics(
            () => {
                let scheduleDetails: { borrower: string, itemIds: string[] };
                return this.performAllFVAs(input)
                    .then(() => this.getScheduleDetails(input.scheduleId))
                    .then((details: { borrower: string; itemIds: string[] }) => {
                        scheduleDetails = details
                        scheduleDetails.itemIds.map((id: string) =>
                            this.itemTable.changeBorrower(id, scheduleDetails.borrower, "borrow", input.notes)
                        )
                    }).then(() => {
                        return this.scheduleTable.delete(input.scheduleId)
                    }).then(() => {
                        return `Successfully borrowed items from schedule '${input.scheduleId}' for '${scheduleDetails.borrower}'.`
                    });
            },
            BorrowFromSchedule.NAME, this.metrics
        );
    }
    

    /**
     * Get schedule details
     *
     * @param scheduleId ID of the schedule
     */
    // @returns Promise that resolves to an object containing the borrower and item IDs
    // @throws Error if there are no schedules with specified schedule ID
    private getScheduleDetails(scheduleId: string): Promise<{borrower: string, itemIds: string[]}> {
        return this.scheduleTable.get(scheduleId)
            .then((schedule) => {
                if (schedule == undefined) {
                    throw new Error(`Reservation not found. id: '${scheduleId}' is invalid`)
                }
                return {'borrower': schedule.borrower, 'itemIds': schedule.itemIds}
            })
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