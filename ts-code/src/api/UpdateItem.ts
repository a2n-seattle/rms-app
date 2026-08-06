import { MainTable } from "../db/MainTable"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"

/**
 * Updates a MainSchema family's own attributes (name/description/location)
 * post-creation. Tags are intentionally out of scope -- already covered by
 * UpdateTags.
 */
export class UpdateItem {
    public static NAME: string = "update item"

    private readonly mainTable: MainTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.mainTable = new MainTable(client)
        this.metrics = metrics
    }

    /**
     * Required params:
     * @param id ID of the family to update
     * Optional params (only provided fields are updated):
     * @param name New display name. Also updates `nameKey` (lowercased) so
     *   name-based lookups (getByName/getByNameConsistent) stay correct.
     * @param description New description
     * @param location New location
     */
    public execute(input: UpdateItemInput): Promise<string> {
        return emitAPIMetrics(
            () => {
                return this.performAllFVAs(input)
                    .then(() => {
                        const updates: Promise<unknown>[] = []
                        if (input.name !== undefined) {
                            updates.push(this.mainTable.update(input.id, "name", input.name))
                            updates.push(this.mainTable.update(input.id, "nameKey", input.name.toLowerCase()))
                        }
                        if (input.description !== undefined) {
                            updates.push(this.mainTable.update(input.id, "description", input.description))
                        }
                        if (input.location !== undefined) {
                            updates.push(this.mainTable.update(input.id, "location", input.location))
                        }
                        return Promise.all(updates)
                    })
                    .then(() => input.id)
            },
            UpdateItem.NAME, this.metrics
        )
    }

    private performAllFVAs(input: UpdateItemInput): Promise<void> {
        return new Promise((resolve, reject) => {
            if (input.id == undefined) {
                reject(new Error("Missing required field 'id'"))
            }
            resolve()
        })
    }
}

export interface UpdateItemInput {
    id?: string,
    name?: string,
    description?: string,
    location?: string
}
