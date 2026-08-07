import { HistorySchema } from "../db/Schemas"
import { getUntilLimit } from "../db/getUntilLimit"
import { HistoryTable } from "../db/HistoryTable"
import { UserTable } from "../db/UserTable"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"

const DEFAULT_PAGE_SIZE = 25

/**
 * Lists borrow/return history entries for a given borrower, sourced from UserTable.history
 * (a denormalized index maintained by BorrowItem/ReturnItem/BorrowFromSchedule via
 * ItemTable.changeBorrower) rather than a full HistoryTable Scan -- see GH-384.
 */
export class ListHistory {
    public static NAME: string = "list history"

    private readonly historyTable: HistoryTable
    private readonly userTable: UserTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.historyTable = new HistoryTable(client)
        this.userTable = new UserTable(client)
        this.metrics = metrics
    }

    public execute(input: ListHistoryInput): Promise<ListHistoryResult> {
        return emitAPIMetrics(
            () => {
                return this.performAllFVAs(input)
                    .then(() => this.userTable.get(input.borrower))
                    .then((user) => getUntilLimit<HistorySchema>(
                        user?.history ?? [],
                        (id) => this.historyTable.get(id),
                        input.limit ?? DEFAULT_PAGE_SIZE,
                        input.pageToken
                    ))
            },
            ListHistory.NAME, this.metrics
        )
    }

    private performAllFVAs(input: ListHistoryInput): Promise<void> {
        return new Promise((resolve, reject) => {
            if (input.borrower == undefined) {
                reject(new Error("Missing required field 'borrower'"))
            }
            resolve()
        })
    }
}

export interface ListHistoryInput {
    borrower?: string,
    limit?: number,
    pageToken?: string
}

export interface ListHistoryResult {
    items: HistorySchema[],
    nextPageToken?: string
}
