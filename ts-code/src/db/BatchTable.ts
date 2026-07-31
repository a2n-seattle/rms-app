import { BATCH_TABLE, BatchSchema, ITEMS_TABLE, ItemsSchema, MAIN_TABLE, MainSchema } from "./Schemas"
import { DBClient } from "../injection/db/DBClient"
import { DeleteCommandInput, GetCommandInput, GetCommandOutput, PutCommandInput, UpdateCommandInput } from "@aws-sdk/lib-dynamodb"

export class BatchTable {
    private readonly client: DBClient

    public constructor(client: DBClient) {
        this.client = client
    }

    /**
     * Adds specified items to batch. Will override existing batch if exists.
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
                    id: name.toLowerCase(),
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
                            "id": item.name
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
                                    "id": name.toLowerCase()
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
        return this.getItemName(id)
            .then((name: string) => this.removeBatchFromMain(batchName, name))
    }

    private getItemName(id: string): Promise<string> {
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
                return item.name
            })
    }

    private removeBatchFromMain(batchName: string, name: string): Promise<any> {
        const getMainParams: GetCommandInput = {
            TableName: MAIN_TABLE,
            Key: {
                "id": name
            }
        }
        return this.client.get(getMainParams)
            .then((mainOutput: GetCommandOutput) => {
                const main: MainSchema = mainOutput.Item as MainSchema
                if (!main) {
                    throw Error(`Unable to find name ${name}`)
                }

                const idx: number = main.batch.indexOf(batchName)
                if (idx < 0 || idx >= main.batch.length) {
                    throw Error(`Unable to find batch ${batchName} in item`)
                }

                const deleteParams: UpdateCommandInput = {
                    TableName: MAIN_TABLE,
                    Key: {
                        "id": name
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
     * Get list of IDs from Batch Name
     */
    public get(
        name: string
    ): Promise<BatchSchema> {
        const params: GetCommandInput = {
            TableName: BATCH_TABLE,
            Key: {
                "id": name.toLowerCase()
            }
        }
        return this.client.get(params)
            .then((output: GetCommandOutput) => output.Item as BatchSchema)
    }
}