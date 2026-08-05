import { MAIN_TABLE, ITEMS_TABLE, ItemsSchema, HistorySchema, HISTORY_TABLE, MainSchema } from "./Schemas";
import { DBClient } from "../injection/db/DBClient"
import { DeleteCommandInput, GetCommandInput, GetCommandOutput, PutCommandInput, PutCommandOutput, UpdateCommandInput } from "@aws-sdk/lib-dynamodb"

export class ItemTable {
    private readonly client: DBClient

    public constructor(client: DBClient) {
        this.client = client
    }

    /**
     * Adds item to inventory
     */
    public create(
        id: string,
        name: string,
        notes: string,
        friendlyName?: string
    ): Promise<PutCommandOutput> {
        return this.get(id)
            .then((entry: ItemsSchema) => {
                if (entry) {
                    throw Error(`RMS ID ${id} is not unique.`)
                } else {
                    const mainParams: UpdateCommandInput = {
                        TableName: MAIN_TABLE,
                        Key: {
                            "id": name.toLowerCase()
                        },
                        UpdateExpression: "SET #key = list_append(#key, :val)",
                        ExpressionAttributeNames: {
                            "#key": "items"
                        },
                        ExpressionAttributeValues: {
                            ":val": [id]
                        }
                    }

                    const item: ItemsSchema = {
                        id: id,
                        name: name.toLowerCase(),
                        friendlyName: friendlyName ?? id,
                        notes: notes,
                        borrower: "",
                        borrowTime: 0,
                        returnTime: 0,
                        history: [],
                        schedule: []
                    }

                    const indexParams: PutCommandInput = {
                        TableName: ITEMS_TABLE,
                        Item: item
                    }

                    return this.client.update(mainParams)
                        .then(() => this.client.put(indexParams))
                }
            })
    }

    /**
     * Delete Item if exists. Returns corresponding name of item
     */
    public delete(
        id: string
    ): Promise<string> {
        return this.get(id)
            .then((entry: ItemsSchema) => {
                if (entry) {
                    const itemsParams: DeleteCommandInput = {
                        TableName: ITEMS_TABLE,
                        Key: {
                            "id": id
                        }
                    }

                    const getMainParams: GetCommandInput = {
                        TableName: MAIN_TABLE,
                        Key: {
                            "id": entry.name
                        }
                    }

                    return this.client.delete(itemsParams)
                        .then(() => this.client.get(getMainParams))
                        .then((output: GetCommandOutput) => {
                            const item: MainSchema = output.Item as MainSchema
                            
                            if (item) {
                                const idx: number = item.items.indexOf(id)

                                if (idx < 0 || idx >= item.items.length) {
                                    throw Error(`Unable to find id ${id} in main`)
                                }

                                const updateMainParams: UpdateCommandInput = {
                                    TableName: MAIN_TABLE,
                                    Key: {
                                        "id": entry.name
                                    },
                                    UpdateExpression: `REMOVE #key[${idx}]`,
                                    ExpressionAttributeNames: {
                                        "#key": "items"
                                    }
                                }
                                return this.client.update(updateMainParams)
                            } else {
                                throw Error(`Unable to find name ${entry.name}`)
                            }
                        }).then(() => entry.name)
                } else {
                    throw Error(`Item ${id} doesn't exist.`)
                }
            })
    }

    /**
     * Get name from id
     */
    public get(
        id: string
    ): Promise<ItemsSchema> {
        const params: GetCommandInput = {
            TableName: ITEMS_TABLE,
            Key: {
                "id": id
            }
        }
        return this.client.get(params)
            .then((output: GetCommandOutput) => output.Item as ItemsSchema)
    }

    /**
     * Update item attribute
     */
     public updateItem(
        id: string,
        key: "notes",
        val: string,
        expectedValue?: string
    ): Promise<GetCommandOutput> {
        const itemSearchParams: GetCommandInput = {
            TableName: ITEMS_TABLE,
            Key: {
                "id": id
            }
        }
        return this.client.get(itemSearchParams)
            .then((data: GetCommandOutput) => {
                if (data.Item) {
                    const entry: ItemsSchema = data.Item as ItemsSchema

                    if (expectedValue !== undefined && entry[key] !== expectedValue) {
                        throw Error(`'${key}' is currently '${entry[key]}', `
                            + `which isn't equal to the expected value of '${expectedValue}'.`)
                    } else {
                        const updateParams: UpdateCommandInput = {
                            TableName: ITEMS_TABLE,
                            Key: {
                                "id": id
                            },
                            UpdateExpression: "SET #key = :val",
                            ExpressionAttributeNames: {
                                "#key": key
                            },
                            ExpressionAttributeValues: {
                                ":val": val
                            }
                        }
                        return this.client.update(updateParams)
                    }
                } else {
                    throw Error(`Couldn't find item ${id} in the database.`)
                }
            })
    }

    /**
     * Special update function, specific for changing the borrower of a item.
     *
     * @param borrowGroupId On "borrow", the schedule id BorrowFromSchedule consumed to borrow
     *   this item (if any) -- recorded on the item so a later batched return can look up
     *   everything borrowed together. Cleared automatically on "return". Ignored (has no
     *   effect) when action is "return".
     * @param condition On "return", optional condition notes to record on the history entry
     *   (e.g. "cracked screen"). Ignored when action is "borrow".
     */
    public changeBorrower(
        id: string,
        borrower: string,
        action: "borrow" | "return",
        notes: string,
        borrowGroupId?: string,
        condition?: string
    ) {
        return this.updateBorrowStatus(id, borrower, action, borrowGroupId)
            .then((name: string) => this.createHistoryEntry(name, id, borrower, action, notes, condition))
    }

    private updateBorrowStatus(
        id: string,
        borrower: string,
        action: "borrow" | "return",
        borrowGroupId?: string
    ): Promise<string> {
        const expectedBorrower: string = (action === "borrow") ? "" : borrower
        const nextBorrower: string = (action === "borrow") ? borrower : ""

        const itemSearchParams: GetCommandInput = {
            TableName: ITEMS_TABLE,
            Key: {
                "id": id
            }
        }
        return this.client.get(itemSearchParams)
            .then((data: GetCommandOutput) => {
                if (!data.Item) {
                    throw Error(`Couldn't find item ${id} in the database.`)
                }

                const entry: ItemsSchema = data.Item as ItemsSchema
                this.assertExpectedBorrower(entry.borrower, expectedBorrower, action)

                const curEpochMs: number = Date.now()
                return this.setItemField(id, "borrower", nextBorrower)
                    .then(() => (action === "borrow")
                        ? this.setItemField(id, "borrowTime", curEpochMs).then(() => this.setItemField(id, "returnTime", 0))
                        : this.setItemField(id, "returnTime", curEpochMs))
                    .then(() => (action === "borrow" && borrowGroupId)
                        ? this.setItemField(id, "borrowGroupId", borrowGroupId)
                        : (action === "return" ? this.removeItemField(id, "borrowGroupId") : Promise.resolve()))
                    .then(() => entry.name)
            })
    }

    private assertExpectedBorrower(
        actualBorrower: string,
        expectedBorrower: string,
        action: "borrow" | "return"
    ): void {
        if (actualBorrower !== expectedBorrower) {
            if (action === "borrow") {
                throw Error("Unable to borrow item: "
                    + `Item is currently being borrowed by '${actualBorrower}'.`)
            } else {
                throw Error("Unable to return item: "
                    + `Borrower in database is '${actualBorrower}', `
                    + `which isn't equal to the specified borrower of '${expectedBorrower}'.`)
            }
        }
    }

    private setItemField(id: string, key: string, val: string | number): Promise<any> {
        const updateParams: UpdateCommandInput = {
            TableName: ITEMS_TABLE,
            Key: {
                "id": id
            },
            UpdateExpression: "SET #key = :val",
            ExpressionAttributeNames: {
                "#key": key
            },
            ExpressionAttributeValues: {
                ":val": val
            }
        }
        return this.client.update(updateParams)
    }

    private removeItemField(id: string, key: string): Promise<any> {
        const updateParams: UpdateCommandInput = {
            TableName: ITEMS_TABLE,
            Key: {
                "id": id
            },
            UpdateExpression: "REMOVE #key",
            ExpressionAttributeNames: {
                "#key": key
            }
        }
        return this.client.update(updateParams)
    }

    /**
     * Create new entry in borrow/return history table
     */
     private createHistoryEntry(
        name: string,
        id: string,
        borrower: string,
        action: "borrow" | "return",
        notes: string,
        condition?: string
    ): Promise<PutCommandOutput> {
        const curEpochMs: number = Date.now()
        const key: string = `${curEpochMs}-${id}`
        const item: HistorySchema = {
            id: key,
            name: name,
            itemId: id,
            borrower: borrower,
            action: action,
            notes: notes,
            timestamp: curEpochMs,
            ...(action === "return" && condition ? { condition } : {})
        }
        const addHistoryParams: PutCommandInput = {
            TableName: HISTORY_TABLE,
            Item: item
        }

        const updateMainParams: UpdateCommandInput = {
            TableName: ITEMS_TABLE,
            Key: {
                "id": id
            },
            UpdateExpression: "SET #key = list_append(#key, :val)",
            ExpressionAttributeNames: {
                "#key": "history"
            },
            ExpressionAttributeValues: {
                ":val": [key]
            }
        }

        return this.client.put(addHistoryParams)
            .then(() => this.client.update(updateMainParams))
    }
}