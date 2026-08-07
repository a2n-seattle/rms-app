import { randomUUID } from "crypto"
import { MAIN_TABLE, MainSchema } from "./Schemas"
import { DBClient } from "../injection/db/DBClient"
import { DeleteCommandInput, DeleteCommandOutput, GetCommandInput, GetCommandOutput, PutCommandInput, ScanCommandInput, ScanCommandOutput, UpdateCommandInput, UpdateCommandOutput } from "@aws-sdk/lib-dynamodb"

export class MainTable {
    private readonly client: DBClient

    public constructor(client: DBClient) {
        this.client = client
    }

    /**
     * Create new description for item family. Id is a random UUID, independent of name.
     *
     * Tags, Items, and Batch are initialized as empty.
     */
    public create(
        name: string,
        description: string,
        owner: string,
        location: string,
        type?: "item" | "room"
    ): Promise<string> {
        const id = this.generateId()
        const item: MainSchema = {
            id,
            nameKey: name.toLowerCase(),
            name: name,
            description: description,
            owner: owner,
            location: location,
            batch: [],
            tags: [],
            items: [],
            ...(type ? { type } : {})
        }
        const params: PutCommandInput = {
            TableName: MAIN_TABLE,
            Item: item
        }
        return this.client.put(params).then(() => id)
    }

    /**
     * Delete description, by id.
     *
     * Checks that Tags and Items are empty before proceeding.
     */
    public delete(
        id: string
    ): Promise<DeleteCommandOutput> {
        return this.getConsistent(id)
            .then((entry: MainSchema) => {
                if (entry.items.length !== 0) {
                    throw Error(`Entry '${id}' still contains items.`)
                } else if (entry.tags.length !== 0) {
                    throw Error(`Entry '${id}' still contains tags.`)
                } else {
                    const params: DeleteCommandInput = {
                        TableName: MAIN_TABLE,
                        Key: {
                            "id": id
                        }
                    }
                    return this.client.delete(params)
                }
            })
    }

    /**
     * Get description of given item type, by id.
     */
    public get(
        id: string
    ): Promise<MainSchema> {
        const params: GetCommandInput = {
            TableName: MAIN_TABLE,
            Key: {
                "id": id
            }
        }
        return this.client.get(params)
            .then((output: GetCommandOutput) => output.Item as MainSchema)
    }

    /**
     * Get description of given item type, by id.
     */
     public getConsistent(
        id: string
    ): Promise<MainSchema> {
        const params: GetCommandInput = {
            TableName: MAIN_TABLE,
            Key: {
                "id": id
            },
            ConsistentRead: true
        }
        return this.client.get(params)
            .then((output: GetCommandOutput) => output.Item as MainSchema)
    }

    /**
     * Get description of given item type, by name (case-insensitive exact match).
     *
     * Implemented as a Scan+FilterExpression on `nameKey` -- no GSI is available (see
     * storage/tables.ts), and these tables are small church-inventory catalogs, so an
     * unpaginated Scan is an acceptable, infra-free tradeoff. Known limitation: doesn't
     * loop over LastEvaluatedKey, so a match beyond the first Scan page (~1MB) is missed.
     */
    public getByName(
        name: string
    ): Promise<MainSchema | undefined> {
        return this.scanByNameKey(name, false)
    }

    /**
     * Consistent-read variant of getByName. Note DynamoDB Scan's ConsistentRead only
     * guarantees consistency within the (unpaginated) page actually scanned.
     */
    public getByNameConsistent(
        name: string
    ): Promise<MainSchema | undefined> {
        return this.scanByNameKey(name, true)
    }

    private scanByNameKey(name: string, consistentRead: boolean): Promise<MainSchema | undefined> {
        const params: ScanCommandInput = {
            TableName: MAIN_TABLE,
            FilterExpression: "#key = :val",
            ExpressionAttributeNames: {
                "#key": "nameKey"
            },
            ExpressionAttributeValues: {
                ":val": name.toLowerCase()
            },
            ConsistentRead: consistentRead
        }
        return this.client.scan(params)
            .then((output: ScanCommandOutput) => (output.Items?.[0] as MainSchema) ?? undefined)
    }

    /**
     * Update id-level attribute.
     *
     * @param requireExists When true (default), guards against typo'd/nonexistent attribute
     *   names via `attribute_exists(#key)`. Pass false for an attribute that's legitimately
     *   unset until first write -- e.g. `ownerId`, which `create()` never initializes, so
     *   `resolveOwner`'s first-ever assignment on a given family would otherwise always fail
     *   this precondition.
     */
    public update(
        id: string,
        key: string,
        val: string,
        requireExists: boolean = true
    ): Promise<UpdateCommandOutput> {
        const params: UpdateCommandInput = {
            TableName: MAIN_TABLE,
            Key: {
                "id": id
            },
            UpdateExpression: "SET #key = :val",
            ...(requireExists ? { ConditionExpression: 'attribute_exists(#key)' } : {}),
            ExpressionAttributeNames: {
                "#key": key
            },
            ExpressionAttributeValues: {
                ":val": val
            }
        }
        return this.client.update(params)
    }

    /**
     * Test seam: overridden in unit tests (`MainTable.prototype.generateId = jest.fn(...)`)
     * for deterministic ids, mirroring AddItem's existing getUniqueId prototype-patch pattern.
     */
    protected generateId(): string {
        return randomUUID()
    }
}
