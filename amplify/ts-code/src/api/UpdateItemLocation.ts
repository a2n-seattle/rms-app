import { ItemTable } from "../db/ItemTable"
import { TransactionsTable } from "../db/TransactionsTable"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"

/**
 * Update owner of item.
 */
export class UpdateItemOwner {
    public static NAME: string = "update item location"

    private readonly itemTable: ItemTable
    private readonly transactionsTable: TransactionsTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.itemTable = new ItemTable(client)
        this.transactionsTable = new TransactionsTable(client)
        this.metrics = metrics
    }

    public router(number: string, request: string, scratch?: UpdateItemLocationInput): string | Promise<string> {
        if (scratch === undefined) {
            return this.transactionsTable.create(number, UpdateItemOwner.NAME)
                .then(() => "ID of item:")
            } else if (scratch.id === undefined) {
                return this.transactionsTable.appendToScratch(number, "id", request)
                    .then(() => "Current location where item is stored:")
        } else if (scratch.currentLocation === undefined) {
            return this.transactionsTable.appendToScratch(number, "currentLocation", request)
                .then(() => "New location where item will be stored:")
        } else {
            scratch.newLocation = request
            return this.transactionsTable.delete(number)
                .then(() => this.execute(scratch))
        }
    }

    /**
     * Required params for scratch object:
     * @param id ID of Item
     * @param currentOwner Name of current owner
     * @param newOwner Name of new owner
     */
    public execute(input: UpdateItemLocationInput): Promise<string> {
        return emitAPIMetrics(
            () => {
                return this.performAllFVAs(input)
                    .then(() => this.itemTable.updateItem(input.id, "location", input.newLocation, input.currentLocation))
                    .then(() => `Successfully updated owner for item '${input.id}'`)
            },
            UpdateItemOwner.NAME, this.metrics
        )
    }
    private performAllFVAs(input: UpdateItemLocationInput): Promise<void> {
        return new Promise((resolve, reject) => {
            if (input.id == undefined) {
                reject(new Error("Missing required field 'id'"))
            } else if (input.currentLocation == undefined) {
                reject(new Error("Missing required field 'currentLocation'"))
            } else if (input.newLocation == undefined) {
                reject(new Error("Missing required field 'newLocation'"))
            }
            resolve()
        })
    }
}

export interface UpdateItemLocationInput {
    id?: string
    currentLocation?: string
    newLocation?: string
}