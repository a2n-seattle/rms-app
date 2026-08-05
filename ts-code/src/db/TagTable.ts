import { MAIN_TABLE, MainSchema, TAGS_TABLE, TagsSchema } from "./Schemas"
import { DBClient } from "../injection/db/DBClient"
import { DeleteCommandInput, GetCommandInput, GetCommandOutput, PutCommandInput, UpdateCommandInput } from "@aws-sdk/lib-dynamodb"

export class TagTable {
    private readonly client: DBClient

    public constructor(client: DBClient) {
        this.client = client
    }

    /**
     * Adds tags to given item family id
     */
    public create(
        id: string,
        tags: string[]
    ): Promise<any> {
        tags = tags === undefined ? [] : tags
        return Promise.all(tags.map((tag: string) => this.createSingleTag(id, tag)))
    }

    private createSingleTag(
        id: string,
        tag: string
    ): Promise<any> {
        return this.getConsistent(tag)
            .then((tagEntry: TagsSchema) => {
                if (tagEntry && tagEntry.val.includes(id)) {
                    // Contains tag already. Do nothing.
                    return
                } else {
                    const mainParams: UpdateCommandInput = {
                        TableName: MAIN_TABLE,
                        Key: {
                            "id": id
                        },
                        UpdateExpression: "SET #key = list_append(#key, :val)",
                        ExpressionAttributeNames: {
                            "#key": "tags"
                        },
                        ExpressionAttributeValues: {
                            ":val": [tag]
                        }
                    }

                    return this.client.update(mainParams)
                        .then(() => {
                            if (tagEntry) {
                                // Index exists, so update
                                const updateParam: UpdateCommandInput = {
                                    TableName: TAGS_TABLE,
                                    Key: {
                                        "id": tag
                                    },
                                    UpdateExpression: "SET #key = list_append(#key, :val)",
                                    ExpressionAttributeNames: {
                                        "#key": "val"
                                    },
                                    ExpressionAttributeValues: {
                                        ":val": [id]
                                    }
                                }
                                return this.client.update(updateParam)
                            } else {
                                // Index doesn't exists, so put
                                const putItem: TagsSchema = {
                                    id: tag,
                                    val: [id]
                                }
                                const putParam: PutCommandInput = {
                                    TableName: TAGS_TABLE,
                                    Item: putItem
                                }
                                return this.client.put(putParam)
                            }
                        })
                }
            })
    }

    /**
     * Delete tags from given item family id
     */
    public delete(
        id: string,
        tags: string[]
    ): Promise<any> {
        return tags.reduce((prev: Promise<any>, tag: string) => prev.then(() => this.deleteSingleTag(id, tag)), Promise.resolve())
    }

    private deleteSingleTag(
        id: string,
        tag: string
    ): Promise<any> {
        return this.getConsistent(tag)
            .then((tagEntry: TagsSchema) => {
                if (tagEntry && tagEntry.val.includes(id)) {
                    const mainGetParams: GetCommandInput = {
                        TableName: MAIN_TABLE,
                        Key: {
                            "id": id
                        }
                    }

                    return this.client.get(mainGetParams)
                        .then((output: GetCommandOutput) => {
                            const item: MainSchema = output.Item as MainSchema

                            if (item) {
                                const idx: number = item.tags.indexOf(tag)

                                if (idx < 0 || idx >= item.tags.length) {
                                    throw Error(`Unable to find id ${tag} in main`)
                                }


                                const updateMainParams: UpdateCommandInput = {
                                    TableName: MAIN_TABLE,
                                    Key: {
                                        "id": id
                                    },
                                    UpdateExpression: `REMOVE #key[${idx}]`,
                                    ExpressionAttributeNames: {
                                        "#key": "tags"
                                    }
                                }
                                return this.client.update(updateMainParams)
                            } else {
                                throw Error(`Unable to find item family ${id}`)
                            }
                        }).then(() => {
                            if (tagEntry.val.length === 1) {
                                const tagDeleteParams: DeleteCommandInput = {
                                    TableName: TAGS_TABLE,
                                    Key: {
                                        "id": tag
                                    }
                                }
                                return this.client.delete(tagDeleteParams)
                            } else {
                                const idx: number = tagEntry.val.indexOf(id)

                                if (idx < 0 || idx >= tagEntry.val.length) {
                                    throw Error(`Unable to find id ${tag} in main`)
                                }

                                const tagUpdateParams: UpdateCommandInput = {
                                    TableName: TAGS_TABLE,
                                    Key: {
                                        "id": tag
                                    },
                                    UpdateExpression: `REMOVE #key[${idx}]`,
                                    ExpressionAttributeNames: {
                                        "#key": "val"
                                    }
                                }
                                return this.client.update(tagUpdateParams)
                            }
                        })
                } else {
                    // Doesn't contain tag, so do nothing.
                    return
                }
            })
    }

    public update(
        id: string,
        tags: string[]
    ): Promise<any> {
        const mainParam: GetCommandInput = {
            TableName: MAIN_TABLE,
            Key: {
                "id": id
            }
        }
        return this.client.get(mainParam)
            .then((data: GetCommandOutput) => {
                if (data.Item) {
                    const entry: MainSchema = data.Item as MainSchema
                    const createTags = tags.filter((newTag: string) => !entry.tags.includes(newTag))
                    const deleteTags = entry.tags.filter((curTag: string) => !tags.includes(curTag))
                    return this.delete(id, deleteTags)
                        .then(() => this.create(id, createTags))
                } else {
                    throw Error(`Could not find '${id}' in the database.`)
                }
            })
    }

    /**
     * Get list of item family ids from tag
     */
    public get(
        tag: string
    ): Promise<TagsSchema> {
        const params: GetCommandInput = {
            TableName: TAGS_TABLE,
            Key: {
                "id": tag
            }
        }
        return this.client.get(params)
            .then((output: GetCommandOutput) => output.Item as TagsSchema)
    }

    /**
     * Get list of item family ids from tag
     */
     public getConsistent(
        tag: string
    ): Promise<TagsSchema> {
        const params: GetCommandInput = {
            TableName: TAGS_TABLE,
            Key: {
                "id": tag
            },
            ConsistentRead: true
        }
        return this.client.get(params)
            .then((output: GetCommandOutput) => output.Item as TagsSchema)
    }
}
