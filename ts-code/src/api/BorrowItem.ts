import { ItemTable } from "../db/ItemTable"
import { TransactionsTable } from "../db/TransactionsTable"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"


/**
 * Borrow specified item
 */
export class BorrowItem {
    public static NAME: string = "borrow item"

    private readonly itemTable: ItemTable
    private readonly transactionsTable: TransactionsTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.itemTable = new ItemTable(client)
        this.transactionsTable = new TransactionsTable(client)
        this.metrics = metrics
    }

    public router(number: string, request: string, scratch?: BorrowItemInput): string | Promise<string> {
        if (scratch === undefined) {
            return this.transactionsTable.create(number, BorrowItem.NAME)
                .then(() => "IDs of Items (separated by spaces):")
        } else if (scratch.ids === undefined) {
            const ids: string[] = request.split(/(\s+)/)
                .filter((str: string) => str.trim().length > 0)
                .map((str: string) => str.toLowerCase().trim())
            return this.transactionsTable.appendToScratch(number, "ids", ids)
                .then(() => "Name of intended borrower:")
        } else if (scratch.borrower === undefined) {
            return this.transactionsTable.appendToScratch(number, "borrower", request)
                .then(() => "Optional notes to leave about this action:")
        } else {
            scratch.notes = request
            return this.transactionsTable.delete(number)
                .then(() => this.execute(scratch))
        }
    }

    /**
     * Required params in scratch object:
     * @param ids IDs of Items
     * @param borrower Name of borrower
     * @param notes Notes about this action
     */
    public execute(input: BorrowItemInput): Promise<string> {
        return emitAPIMetrics(
            () => {
                return this.performAllFVAs(input)
                    .then(()=>{
                        return Promise.all(input.ids.map((id: string) =>
                        this.itemTable.changeBorrower(id, input.borrower, "borrow", input.notes)
                ))
            })
            .then(() => `Successfully borrowed items '${input.ids.toString()}'.`)
    },
            BorrowItem.NAME, this.metrics
        )
    }
    private performAllFVAs(input: BorrowItemInput): Promise<void> {
        return new Promise((resolve, reject) => {
            if (input.ids == undefined) {
                reject(new Error("Missing required field 'ids'"))
            } else if (input.borrower == undefined) {
                reject(new Error("Missing required field 'borrower'"))
            }
            resolve()
        })
    }
}

export interface BorrowItemInput {
    ids?: string[],
    borrower?: string,
    notes?: string
}