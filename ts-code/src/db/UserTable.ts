import { USER_TABLE, UserSchema } from "./Schemas"
import { DBClient } from "../injection/db/DBClient"
import { GetCommandInput, GetCommandOutput, PutCommandInput, UpdateCommandInput } from "@aws-sdk/lib-dynamodb"

type ListField = "owned" | "reserved" | "borrowed" | "history"

/**
 * Per-user index of owned/reserved/borrowed item/schedule ids, keyed by Cognito `sub`. Uses
 * the same list_append-based add/remove pattern (and the same non-atomic read-modify-write
 * caveat) already used by MainTable/BatchTable's list fields elsewhere in this codebase.
 */
export class UserTable {
    private readonly client: DBClient

    public constructor(client: DBClient) {
        this.client = client
    }

    /**
     * Fetch a user's entry, creating an empty one if it doesn't exist yet.
     */
    public getOrCreate(id: string): Promise<UserSchema> {
        return this.get(id)
            .then((entry: UserSchema) => {
                if (entry) {
                    return entry
                }
                const item: UserSchema = { id, owned: [], reserved: [], borrowed: [], history: [] }
                const params: PutCommandInput = {
                    TableName: USER_TABLE,
                    Item: item
                }
                return this.client.put(params).then(() => item)
            })
    }

    public get(id: string): Promise<UserSchema> {
        const params: GetCommandInput = {
            TableName: USER_TABLE,
            Key: {
                "id": id
            }
        }
        return this.client.get(params)
            .then((output: GetCommandOutput) => output.Item as UserSchema)
    }

    public addOwned(id: string, mainId: string): Promise<any> {
        return this.addToList(id, "owned", mainId)
    }

    public removeOwned(id: string, mainId: string): Promise<any> {
        return this.removeFromList(id, "owned", mainId)
    }

    public addReserved(id: string, scheduleId: string): Promise<any> {
        return this.addToList(id, "reserved", scheduleId)
    }

    public removeReserved(id: string, scheduleId: string): Promise<any> {
        return this.removeFromList(id, "reserved", scheduleId)
    }

    public addBorrowed(id: string, itemId: string): Promise<any> {
        return this.addToList(id, "borrowed", itemId)
    }

    public removeBorrowed(id: string, itemId: string): Promise<any> {
        return this.removeFromList(id, "borrowed", itemId)
    }

    /** History is an append-only audit log -- no removeHistory counterpart. */
    public addHistory(id: string, historyId: string): Promise<any> {
        return this.addToList(id, "history", historyId)
    }

    private addToList(id: string, field: ListField, val: string): Promise<any> {
        return this.getOrCreate(id)
            .then(() => {
                const params: UpdateCommandInput = {
                    TableName: USER_TABLE,
                    Key: {
                        "id": id
                    },
                    UpdateExpression: "SET #key = list_append(#key, :val)",
                    ExpressionAttributeNames: {
                        "#key": field
                    },
                    ExpressionAttributeValues: {
                        ":val": [val]
                    }
                }
                return this.client.update(params)
            })
    }

    private removeFromList(id: string, field: ListField, val: string): Promise<any> {
        return this.get(id)
            .then((entry: UserSchema) => {
                if (!entry) {
                    return
                }
                const idx: number = entry[field].indexOf(val)
                if (idx < 0) {
                    return
                }
                const params: UpdateCommandInput = {
                    TableName: USER_TABLE,
                    Key: {
                        "id": id
                    },
                    UpdateExpression: `REMOVE #key[${idx}]`,
                    ExpressionAttributeNames: {
                        "#key": field
                    }
                }
                return this.client.update(params)
            })
    }
}
