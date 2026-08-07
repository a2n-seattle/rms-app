import { ItemTable } from "../db/ItemTable"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"

/**
 * Updates an ItemsSchema sub-item's own attributes (friendly name/notes)
 * post-creation.
 */
export class UpdateSubItem {
    public static NAME: string = "update sub item"

    private readonly itemTable: ItemTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.itemTable = new ItemTable(client)
        this.metrics = metrics
    }

    /**
     * Required params:
     * @param id ID of the sub-item to update
     * Optional params (only provided fields are updated):
     * @param name New friendly name
     * @param notes New notes
     */
    public execute(input: UpdateSubItemInput): Promise<string> {
        return emitAPIMetrics(
            () => {
                return this.performAllFVAs(input)
                    .then(() => {
                        const updates: Promise<unknown>[] = []
                        if (input.name !== undefined) {
                            updates.push(this.itemTable.updateItem(input.id, "name", input.name))
                        }
                        if (input.notes !== undefined) {
                            updates.push(this.itemTable.updateItem(input.id, "notes", input.notes))
                        }
                        return Promise.all(updates)
                    })
                    .then(() => input.id)
            },
            UpdateSubItem.NAME, this.metrics
        )
    }

    private performAllFVAs(input: UpdateSubItemInput): Promise<void> {
        return new Promise((resolve, reject) => {
            if (input.id == undefined) {
                reject(new Error("Missing required field 'id'"))
            }
            resolve()
        })
    }
}

export interface UpdateSubItemInput {
    id?: string,
    name?: string,
    notes?: string
}
