import { MainTable } from "../db/MainTable"
import { ItemTable } from "../db/ItemTable"
import { TagTable } from "../db/TagTable"
import { TransactionsTable } from "../db/TransactionsTable"
import { MainSchema, ItemsSchema } from "../db/Schemas"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"

/**
 * Adds item to item inventory table.
 */
export class AddItem {
    public static NAME: string = "add item"

    private readonly mainTable: MainTable
    private readonly itemTable: ItemTable
    private readonly tagTable: TagTable
    private readonly transactionsTable: TransactionsTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.mainTable = new MainTable(client)
        this.itemTable = new ItemTable(client)
        this.tagTable = new TagTable(client)
        this.transactionsTable = new TransactionsTable(client)
        this.metrics = metrics
    }

    public router(number: string, request: string, scratch?: AddItemInput): string | Promise<string> {
        if (scratch === undefined) {
            return this.transactionsTable.create(number, AddItem.NAME)
                .then(() => "Name of item:")
        } else if (scratch.name === undefined) {
            return this.transactionsTable.appendToScratch(number, "name", request)
                .then(() => this.mainTable.get(request))
                .then((item: MainSchema) => {
                    if (item) {
                        // Item already exists. Just append new item.
                        return this.transactionsTable.appendToScratch(number, "createItem", false)
                            .then(() => "Owner of this item (or location where it's stored if church owned):")
                    } else {
                        // Item doesn't exist, so need to create new item.
                        return this.transactionsTable.appendToScratch(number, "createItem", true)
                            .then(() => "Related Category Tags (separated by spaces):")
                    }
                })
        } else if (scratch.createItem && scratch.tags == undefined) {
            const tags: string[] = request.split(/(\s+)/)
                .filter((str: string) => str.trim().length > 0)
                .map((str: string) => str.toLowerCase().trim())
            return this.transactionsTable.appendToScratch(number, "tags", tags)
                .then(() => "Optional description of this item:")
        } else if (scratch.createItem && scratch.description == undefined) {
            return this.transactionsTable.appendToScratch(number, "description", request)
                .then(() => "Owner of this item (or location where it's stored if church owned):")
        } else if (scratch.owner === undefined) {
            return this.transactionsTable.appendToScratch(number, "owner", request)
                .then(() => "Optional notes about this specific item:")
        } else {
            scratch.notes = request

            return this.transactionsTable.delete(number)
                .then(() => this.execute(scratch))
                .then((id: string) => `Created Item with RMS ID: ${id}`)
        }
    }

    /**
     * Required params in scratch object:
     * @param id Intended ID of item
     * @param name Name of Item
     * @param description Optional description about the item
     * @param tags Tags to query the item with
     * @param owner Owner of this item (or location where it's stored if church owned)
     * @param tags Notes about this specific item.
     * Params used by router exclusively:
     * @param createItem Flag to indicate item needs to be created (used by the router function)
     */
    public execute(input: AddItemInput): Promise<string> {
        return emitAPIMetrics(
            () => {
                return this.performAllFVAs(input)
                    .then(() => this.mainTable.getConsistent(input.name.toLowerCase()))
                    .then((entry: MainSchema) => {
                        if (entry) {
                        // Object Exists. No need to add description
                            return
                        } else {
                        // Add new Object
                        return this.mainTable.create(input.name, input.description)
                            .then(() => this.tagTable.create(input.name, input.tags))
                        }
                    }).then(() => this.getUniqueId(input.name))
                    .then((id: string) => {
                        return this.itemTable.create(id, input.name, input.owner, input.notes)
                            .then(() => id)
                    })
            },
            AddItem.NAME, this.metrics
        )
    }

    /**
     * @private Generates random unique Id
     * @param id Random Id generator
     */
    public getUniqueId(name: string): Promise<string> {
        const hex = Math.floor(Math.random() * 16777215).toString(16) // Random Hex Code
        const codeName = name.toLowerCase().replace(" ", "_") // To Lowercase
        const id = `${codeName}-${hex}`
        return this.itemTable.get(id)
            .then((item: ItemsSchema) => {
                if (item) {
                    // Item Returned
                    return this.getUniqueId(name)
                } else {
                    // No Item Returned
                    return id;
                }
            })
    }

    private performAllFVAs(input: AddItemInput): Promise<void> {
        return new Promise((resolve, reject) => {
            if (input.name == undefined) {
                reject(new Error("Missing required field 'name'"))
            }
            resolve()
        })
    }
}

export interface AddItemInput {
    name?: string,
    displayName?:string,
    createItem?: boolean,
    description?: string,
    tags?: string[],
    owner?: string,
    notes?: string
}