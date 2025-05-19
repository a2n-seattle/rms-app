import { HistoryTable } from "../db/HistoryTable"
import { ItemTable } from "../db/ItemTable"
import { HistorySchema, ItemsSchema } from "../db/Schemas"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"

/**
 * Get Item either by id or by name.
 */
export class GetItemHistory {
    public static NAME: string = "get item history"

    private readonly itemTable: ItemTable
    private readonly historyTable: HistoryTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.itemTable = new ItemTable(client)
        this.historyTable = new HistoryTable(client)
        this.metrics = metrics
    }

    /**
     * Required params in input object:
     * @param input id of item
     * 
     * Queries the item table for the item with the given id, 
     * and then queries the history table for all history entries belonging to the item
     * 
     * @returns a promise that resolves to an array of history entries
     * @throws Error if the input object is missing the required field 'historyId'
     * @throws Error if the item with the given id does not exist
     */
    public execute(input: GetItemHistoryInput): Promise<HistorySchema[]> {
        return emitAPIMetrics(
            () => {
                return this.performAllFVAs(input)
                .then(() => this.itemTable.get(input.itemId))
                .then((item: ItemsSchema) => {
                    if (item === undefined) {
                        throw new Error(`Item not found. id: '${input.itemId}' is invalid`)
                    }
                    return Promise.all(item.history.map((historyId) => this.historyTable.get(historyId)))
                    .then((historyEntries: HistorySchema[]) => {
                        return historyEntries
                    })
                })
            },
            GetItemHistory.NAME, this.metrics
        )
    }
    
    private performAllFVAs(input: GetItemHistoryInput): Promise<void> {
        return new Promise((resolve, reject) => {
            if (input.itemId == undefined) {
                reject(new Error("Missing required field 'itemId'"))
            }
            resolve()
        })
    }
}

export interface GetItemHistoryInput {
    itemId?: string
}