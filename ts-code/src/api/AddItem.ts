import { randomUUID } from "crypto"
import { MainTable } from "../db/MainTable"
import { ItemTable } from "../db/ItemTable"
import { TagTable } from "../db/TagTable"
import { UserTable } from "../db/UserTable"
import { TransactionsTable } from "../db/TransactionsTable"
import { MainSchema } from "../db/Schemas"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { UserDirectoryClient } from "../injection/cognito/UserDirectoryClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"

/**
 * Adds item to item inventory table.
 */
export class AddItem {
    public static NAME: string = "add item"

    private readonly mainTable: MainTable
    private readonly itemTable: ItemTable
    private readonly tagTable: TagTable
    private readonly userTable: UserTable
    private readonly transactionsTable: TransactionsTable
    private readonly metrics?: MetricsClient
    private readonly userDirectory?: UserDirectoryClient

    public constructor(client: DBClient, metrics?: MetricsClient, userDirectory?: UserDirectoryClient) {
        this.mainTable = new MainTable(client)
        this.itemTable = new ItemTable(client)
        this.tagTable = new TagTable(client)
        this.userTable = new UserTable(client)
        this.transactionsTable = new TransactionsTable(client)
        this.metrics = metrics
        this.userDirectory = userDirectory
    }

    public router(number: string, request: string, scratch?: AddItemInput): string | Promise<string> {
        if (scratch === undefined) {
            return this.transactionsTable.create(number, AddItem.NAME)
                .then(() => "Name of item:")
        } else if (scratch.name === undefined) {
            return this.transactionsTable.appendToScratch(number, "name", request)
                .then(() => this.mainTable.getByName(request))
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
                .then(() => "Location where this item is stored:")
        } else if (scratch.location === undefined) {
            return this.transactionsTable.appendToScratch(number, "location", request)
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
     * @param name Name of Item
     * @param description Optional description about the item
     * @param tags Tags to query the item with
     * @param owner Owner of this item type (or location where it's stored if church owned).
     *   Only set when the item type is first created; ignored on subsequent items of the same name.
     * @param location Location where this item type is stored.
     *   Only set when the item type is first created; ignored on subsequent items of the same name.
     * @param friendlyName Optional human-readable label for this specific item instance.
     *   Defaults to the generated item ID when not provided.
     * @param notes Notes about this specific item.
     * Params used by router exclusively:
     * @param createItem Flag to indicate item needs to be created (used by the router function)
     */
    public execute(input: AddItemInput): Promise<string> {
        return emitAPIMetrics(
            () => {
                return this.performAllFVAs(input)
                    .then(() => this.mainTable.getByNameConsistent(input.name))
                    .then((entry: MainSchema): Promise<FamilyResolution> => {
                        if (entry) {
                            // Object Exists. No need to add description, owner, or location
                            return Promise.resolve({ familyId: entry.id, familyName: entry.name, existingItemCount: entry.items.length })
                        } else {
                            // Add new Object
                            return this.mainTable.create(input.name, input.description, input.owner, input.location, input.type)
                                .then((familyId: string) =>
                                    this.tagTable.create(familyId, input.tags)
                                        .then(() => this.resolveOwner(familyId, input.owner))
                                        .then(() => ({ familyId, familyName: input.name, existingItemCount: 0 })))
                        }
                    })
                    .then(({ familyId, familyName, existingItemCount }: FamilyResolution) =>
                        this.getUniqueId()
                            .then((id: string) => {
                                // Default friendly-name numbering (GH-363): a sub-item with no
                                // explicit friendlyName gets "<family name> <n>" (e.g. "Chairs 1",
                                // "Chairs 2", ...) based on the family's item count *before* this
                                // one is appended, rather than falling all the way through to
                                // ItemTable.create's own `?? id` fallback (a raw UUID).
                                const friendlyName = input.friendlyName ?? `${familyName} ${existingItemCount + 1}`
                                return this.itemTable.create(id, familyId, input.notes, friendlyName).then(() => id)
                            })
                    )
            },
            AddItem.NAME, this.metrics
        )
    }

    /**
     * Attempts to resolve `owner` (free text) against the Cognito user pool by email. On a
     * match, records `ownerId` on the family and indexes it in UserTable.owned. On no match
     * (a room, "the church", etc.), leaves `ownerId` unset -- `owner` stays as display fallback.
     */
    private resolveOwner(familyId: string, owner: string): Promise<void> {
        if (!this.userDirectory) {
            return Promise.resolve()
        }
        return this.userDirectory.findByEmail(owner)
            .then((user): Promise<void> => {
                if (!user) {
                    return Promise.resolve()
                }
                return this.mainTable.update(familyId, "ownerId", user.sub, false)
                    .then(() => this.userTable.addOwned(user.sub, familyId))
                    .then((): void => undefined)
            })
    }

    /**
     * Generates a random unique item id, independent of name.
     */
    public getUniqueId(): Promise<string> {
        const id = randomUUID()
        return this.itemTable.get(id)
            .then((item) => item ? this.getUniqueId() : id)
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
    createItem?: boolean,
    description?: string,
    tags?: string[],
    owner?: string,
    location?: string,
    friendlyName?: string,
    notes?: string,
    type?: "item" | "room"
}

interface FamilyResolution {
    familyId: string,
    familyName: string,
    existingItemCount: number
}
