import { randomUUID } from "crypto"
import { BATCH_TABLE, BatchSchema, ITEMS_TABLE, ItemsSchema, MAIN_TABLE, MainSchema } from "./Schemas"
import { DBClient } from "../injection/db/DBClient"
import { DeleteCommandInput, GetCommandInput, GetCommandOutput, PutCommandInput, ScanCommandInput, ScanCommandOutput, UpdateCommandInput } from "@aws-sdk/lib-dynamodb"

export class BatchTable {
    private readonly client: DBClient

    public constructor(client: DBClient) {
        this.client = client
    }

    /**
     * Adds specified items to batch. Creates a new batch id every call -- if a batch with the
     * same name already exists, the caller (CreateBatch) is responsible for deleting it first
     * to get "same name overwrites" semantics, since id is no longer derived from name.
     *
     * @param name Name of Batch
     * @param ids RMS IDs of the items in the Batch
     */
    public create(
        name: string,
        ids: string[],
        groups: string[]
    ): Promise<any> {
        return Promise.all(ids.map((id: string) => this.attachBatchToItem(name, id)))
            .then(() => {
                const item: BatchSchema = {
                    id: this.generateId(),
                    nameKey: name.toLowerCase(),
                    name: name,
                    val: ids,
                    groups: groups
                }

                const params: PutCommandInput = {
                    TableName: BATCH_TABLE,
                    Item: item
                }

                return this.client.put(params)
            })
            .catch((reason: any) => {
                // Rollback
                return ids.reduce((prev: Promise<any>, id: string) =>
                    prev.then(() =>
                        this.detachBatchFromItem(name, id)
                        .catch((reason: any) => "Ignore Error")
                    )
                , Promise.resolve())
                .then(() => { throw reason })
            })
    }

    private attachBatchToItem(
        batchName: string,
        id: string
    ): Promise<any> {
        const getParams: GetCommandInput = {
            TableName: ITEMS_TABLE,
            Key: {
                "id": id
            }
        }
        return this.client.get(getParams)
            .then((entry: GetCommandOutput) => {
                if (entry.Item !== undefined) {
                    const item: ItemsSchema = entry.Item as ItemsSchema
                    const updateParams: UpdateCommandInput = {
                        TableName: MAIN_TABLE,
                        Key: {
                            "id": item.familyId
                        },
                        UpdateExpression: "SET #key = list_append(#key, :val)",
                        ExpressionAttributeNames: {
                            "#key": "batch"
                        },
                        ExpressionAttributeValues: {
                            ":val": [batchName]
                        }
                    }
                    return this.client.update(updateParams)
                } else {
                    throw new Error(`Unable to find id '${id}'`)
                }
            })
    }

    /**
     * Delete specified batch by name
     *
     * @param name Name of Batch
     * @param ids RMS IDs of the items in the Batch
     */
    public delete(
        name: string
    ): Promise<any> {
        return this.get(name)
            .then((entry: BatchSchema) => {
                if (entry) {
                    return entry.val.reduce((prev: Promise<any>, id: string) => prev.then(() => this.detachBatchFromItem(name, id)), Promise.resolve())
                        .then(() => {
                            const params: DeleteCommandInput = {
                                TableName: BATCH_TABLE,
                                Key: {
                                    "id": entry.id
                                }
                            }

                            return this.client.delete(params)
                        })
                } else {
                    throw new Error(`Batch '${name}' not found.`)
                }
            })
    }

    private detachBatchFromItem(
        batchName: string,
        id: string
    ): Promise<any> {
        return this.getItemFamilyId(id)
            .then((familyId: string) => this.removeBatchFromMain(batchName, familyId))
    }

    private getItemFamilyId(id: string): Promise<string> {
        const getItemParams: GetCommandInput = {
            TableName: ITEMS_TABLE,
            Key: {
                "id": id
            }
        }
        return this.client.get(getItemParams)
            .then((itemOutput: GetCommandOutput) => {
                const item: ItemsSchema = itemOutput.Item as ItemsSchema
                if (!item) {
                    throw Error(`Unable to find item ${id}`)
                }
                return item.familyId
            })
    }

    private removeBatchFromMain(batchName: string, familyId: string): Promise<any> {
        const getMainParams: GetCommandInput = {
            TableName: MAIN_TABLE,
            Key: {
                "id": familyId
            }
        }
        return this.client.get(getMainParams)
            .then((mainOutput: GetCommandOutput) => {
                const main: MainSchema = mainOutput.Item as MainSchema
                if (!main) {
                    throw Error(`Unable to find item family ${familyId}`)
                }

                const idx: number = main.batch.indexOf(batchName)
                if (idx < 0 || idx >= main.batch.length) {
                    throw Error(`Unable to find batch ${batchName} in item`)
                }

                const deleteParams: UpdateCommandInput = {
                    TableName: MAIN_TABLE,
                    Key: {
                        "id": familyId
                    },
                    UpdateExpression: `REMOVE #key[${idx}]`,
                    ExpressionAttributeNames: {
                        "#key": "batch"
                    }
                }
                return this.client.update(deleteParams)
            })
    }

    /**
     * Get batch by name (case-insensitive exact match).
     *
     * Implemented as a Scan+FilterExpression on `nameKey` -- see MainTable.getByName for the
     * same tradeoff/known-limitation notes (no GSI, unpaginated Scan).
     */
    public get(
        name: string
    ): Promise<BatchSchema | undefined> {
        const params: ScanCommandInput = {
            TableName: BATCH_TABLE,
            FilterExpression: "#key = :val",
            ExpressionAttributeNames: {
                "#key": "nameKey"
            },
            ExpressionAttributeValues: {
                ":val": name.toLowerCase()
            }
        }
        return this.client.scan(params)
            .then((output: ScanCommandOutput) => (output.Items?.[0] as BatchSchema) ?? undefined)
    }

    /**
     * Test seam: overridden in unit tests for deterministic ids.
     */
    protected generateId(): string {
        return randomUUID()
    }
}
