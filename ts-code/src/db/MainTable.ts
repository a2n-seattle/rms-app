import { MAIN_TABLE,  MainSchema } from "./Schemas"
import { DBClient } from "../injection/db/DBClient"
import { DeleteCommandInput, DeleteCommandOutput, GetCommandInput, GetCommandOutput, PutCommandInput, PutCommandOutput, UpdateCommandInput, UpdateCommandOutput } from "@aws-sdk/lib-dynamodb"

export class MainTable {
    private readonly client: DBClient

    public constructor(client: DBClient) {
        this.client = client
    }

    /**
     * Create new description for item family.
     *
     * Tags and Items are initialized as empty.
     */
    public create(
        name: string,
        description: string
    ): Promise<PutCommandOutput> {
        const item: MainSchema = {
            id: name.toLowerCase(),
            displayName: name,
            description: description,
            tags: [],
            items: []
        }
        const params: PutCommandInput = {
            TableName: MAIN_TABLE,
            Item: item
        }
        return this.client.put(params)
    }

    /**
     * Delete description
     *
     * Checks that Tags and Items are empty before proceeding.
     */
    public delete(
        name: string
    ): Promise<DeleteCommandOutput> {
        return this.getConsistent(name)
            .then((entry: MainSchema) => {
                if (entry.items.length !== 0) {
                    throw Error(`Entry '${name}' still contains items.`)
                } else if (entry.tags.length !== 0) {
                    throw Error(`Entry '${name}' still contains tags.`)
                } else {
                    const params: DeleteCommandInput = {
                        TableName: MAIN_TABLE,
                        Key: {
                            "id": name.toLowerCase()
                        }
                    }
                    return this.client.delete(params)
                }
            })
    }

    /**
     * Get description of given item type, by name.
     */
    public get(
        name: string
    ): Promise<MainSchema> {
        const params: GetCommandInput = {
            TableName: MAIN_TABLE,
            Key: {
                "id": name.toLowerCase()
            }
        }
        return this.client.get(params)
            .then((output: GetCommandOutput) => output.Item as MainSchema)
    }

    /**
     * Get description of given item type, by name.
     */
     public getConsistent(
        name: string
    ): Promise<MainSchema> {
        const params: GetCommandInput = {
            TableName: MAIN_TABLE,
            Key: {
                "id": name.toLowerCase()
            },
            ConsistentRead: true
        }
        return this.client.get(params)
            .then((output: GetCommandOutput) => output.Item as MainSchema)
    }

    /**
     * Update name level attribute
     */
    public update(
        name: string,
        key: string,
        val: string
    ): Promise<UpdateCommandOutput> {
        const params: UpdateCommandInput = {
            TableName: MAIN_TABLE,
            Key: {
                "id": name.toLowerCase()
            },
            UpdateExpression: "SET #key = :val",
            ConditionExpression: 'attribute_exists(#key)',
            ExpressionAttributeNames: {
                "#key": key
            },
            ExpressionAttributeValues: {
                ":val": val
            }
        }
        return this.client.update(params)
    }
}