import { DBSeed } from "./DBTestConstants";
import { DBClient } from "../../src/injection/db/DBClient";
import {
    DeleteCommandInput, DeleteCommandOutput,
    GetCommandInput, GetCommandOutput,
    PutCommandInput, PutCommandOutput,
    UpdateCommandInput, UpdateCommandOutput,
    ScanCommandInput, ScanCommandOutput
} from "@aws-sdk/lib-dynamodb"
import {
    MAIN_TABLE, MainSchema,
    ITEMS_TABLE, ItemsSchema,
    BATCH_TABLE, BatchSchema,
    TAGS_TABLE, TagsSchema,
    TRANSACTIONS_TABLE, TransactionsSchema,
    HISTORY_TABLE, HistorySchema,
    SCHEDULE_TABLE, ScheduleSchema
} from "../../src/db/Schemas"

// Mimics the shape of aws-sdk v2's StringSet, since this local mock
// doesn't perform real DynamoDB set marshalling.
interface StringSet {
    type: "String"
    values: string[]
}

interface LocalDB {
    main: { [key: string]: MainSchema },
    items: { [key: string]: ItemsSchema },
    batch: { [key: string]: BatchSchema },
    tags: { [key: string]: TagsSchema },
    history: { [key: string]: HistorySchema },
    schedule: { [key: string]: ScheduleSchema}
    transactions: { [key: string]: TransactionsSchema }
}

/**
 * Local instance of DBClient, which stores everything as part of a single object
 */
export class LocalDBClient implements DBClient {

    private db: LocalDB

    constructor(seed: DBSeed = DBSeed.EMPTY) {
        this.db = JSON.parse(JSON.stringify(seed))
    }

    /**
     * Return entire database as a string
     */
    public getDB(): LocalDB {
        return this.db
    }

    public delete(params: DeleteCommandInput): Promise<DeleteCommandOutput> {
        return this.newPromise(() => {
            delete this.getTable(params.TableName)[Object.values(params.Key)[0]]
            return {}
        })
    }

    public get(params: GetCommandInput): Promise<GetCommandOutput> {
        return this.newPromise(() => {
            return { Item: this.getTable(params.TableName)[Object.values(params.Key)[0]] }
        })
    }

    public put(params: PutCommandInput): Promise<PutCommandOutput> {
        return this.newPromise(() => {
            if (params.TableName === MAIN_TABLE) {
                const val: MainSchema = params.Item as MainSchema
                const key: string = val.id
                this.db.main[key] = val
            } else if (params.TableName === ITEMS_TABLE) {
                const val: ItemsSchema = params.Item as ItemsSchema
                const id: string = val.id
                this.db.items[id] = val
            } else if (params.TableName === BATCH_TABLE) {
                const val: BatchSchema = params.Item as BatchSchema
                const key: string = val.id
                this.db.batch[key] = val
            } else if (params.TableName === TAGS_TABLE) {
                const val: TagsSchema = params.Item as TagsSchema
                const key: string = val.id
                this.db.tags[key] = val
            } else if (params.TableName === HISTORY_TABLE) {
                const val: HistorySchema = params.Item as HistorySchema
                const key: string = val.id
                this.db.history[key] = val
            }  else if (params.TableName == SCHEDULE_TABLE) {
                const val: ScheduleSchema = params.Item as ScheduleSchema
                const key: string = val.id
                this.db.schedule[key] = val
            } else if (params.TableName == TRANSACTIONS_TABLE) {
                const val: TransactionsSchema = params.Item as TransactionsSchema
                const key: string = val.number
                this.db.transactions[key] = val
            } else {
                throw new Error("Invalid Table Name: " + params.TableName)
            }
            return {}
        })
    }

    public update(params: UpdateCommandInput): Promise<UpdateCommandOutput> {
        // TODO: Update list append updates, since using sets now.
        return this.newPromise(() => {
            if (params.UpdateExpression === "SET #key = list_append(#key, :val)") {
                // TODO: Maybe a bug, where concatenation is not working
                const key: string = params.ExpressionAttributeNames["#key"]
                const val: string[] = params.ExpressionAttributeValues[":val"]
                const cur: string[] = this.getTable(params.TableName)[Object.values(params.Key)[0]][key]
                this.getTable(params.TableName)[Object.values(params.Key)[0]][key] = cur.concat(val)
            } else if (params.UpdateExpression === "SET #key = :val") {
                const key: string = params.ExpressionAttributeNames["#key"]
                const val: any = params.ExpressionAttributeValues[":val"]
                this.getTable(params.TableName)[Object.values(params.Key)[0]][key] = val
            } else if (params.UpdateExpression === "SET #attr.#key = :val") {
                const attr: string = params.ExpressionAttributeNames["#attr"]
                const key: string = params.ExpressionAttributeNames["#key"]
                const val: any = params.ExpressionAttributeValues[":val"]
                this.getTable(params.TableName)[Object.values(params.Key)[0]][attr][key] = val
            } else if (params.UpdateExpression === "SET #attr1.#attr2.#key = :val") {
                const attr1: string = params.ExpressionAttributeNames["#attr1"]
                const attr2: string = params.ExpressionAttributeNames["#attr2"]
                const key: string = params.ExpressionAttributeNames["#key"]
                const val: any = params.ExpressionAttributeValues[":val"]
                this.getTable(params.TableName)[Object.values(params.Key)[0]][attr1][attr2][key] = val
            } else if (params.UpdateExpression === "REMOVE #attr.#id") {
                const attr: string = params.ExpressionAttributeNames["#attr"]
                const id: string = params.ExpressionAttributeNames["#id"]
                delete this.getTable(params.TableName)[Object.values(params.Key)[0]][attr][id]
            } else if (params.UpdateExpression.substr(0, 12) === "REMOVE #key[") {
                const key: string = params.ExpressionAttributeNames["#key"]
                const idx: string = params.UpdateExpression.substr(12, 1)
                this.getTable(params.TableName)[Object.values(params.Key)[0]][key].splice(idx, 1)
            } else if (params.UpdateExpression === "ADD #key :val") {
                const key: string = params.ExpressionAttributeNames["#key"]
                const val: StringSet = params.ExpressionAttributeValues[":val"]
                if (this.getTable(params.TableName)[Object.values(params.Key)[0]][key]) {
                    this.getTable(params.TableName)[Object.values(params.Key)[0]][key].values
                        = val.values.concat(this.getTable(params.TableName)[Object.values(params.Key)[0]][key].values).sort()
                } else {
                    this.getTable(params.TableName)[Object.values(params.Key)[0]][key] = val
                }
            } else if (params.UpdateExpression === "ADD #attr1.#attr2.#key :val") {
                const attr1: string = params.ExpressionAttributeNames["#attr1"]
                const attr2: string = params.ExpressionAttributeNames["#attr2"]
                const key: string = params.ExpressionAttributeNames["#key"]
                const val: StringSet = params.ExpressionAttributeValues[":val"]
                if (this.getTable(params.TableName)[Object.values(params.Key)[0]][attr1][attr2][key]) {
                    this.getTable(params.TableName)[Object.values(params.Key)[0]][attr1][attr2][key].values
                        = val.values.concat(this.getTable(params.TableName)[Object.values(params.Key)[0]][attr1][attr2][key].values).sort()
                } else {
                    this.getTable(params.TableName)[Object.values(params.Key)[0]][attr1][attr2][key] = val
                }
            } else if (params.UpdateExpression === "DELETE #key :val") {
                const key: string = params.ExpressionAttributeNames["#key"]
                const val: StringSet = params.ExpressionAttributeValues[":val"]
                this.getTable(params.TableName)[Object.values(params.Key)[0]][key].values =
                        this.getTable(params.TableName)[Object.values(params.Key)[0]][key].values
                            .filter((el: string) => !val.values.includes(el))
                if (this.getTable(params.TableName)[Object.values(params.Key)[0]][key].values.length == 0) {
                    this.getTable(params.TableName)[Object.values(params.Key)[0]][key] = undefined
                }
            } else if (params.UpdateExpression === "DELETE #attr1.#attr2.#key :val") {
                const attr1: string = params.ExpressionAttributeNames["#attr1"]
                const attr2: string = params.ExpressionAttributeNames["#attr2"]
                const key: string = params.ExpressionAttributeNames["#key"]
                const val: StringSet = params.ExpressionAttributeValues[":val"]
                this.getTable(params.TableName)[Object.values(params.Key)[0]][attr1][attr2][key].values =
                        this.getTable(params.TableName)[Object.values(params.Key)[0]][attr1][attr2][key].values
                            .filter((el: string) => !val.values.includes(el))
                if (this.getTable(params.TableName)[Object.values(params.Key)[0]][attr1][attr2][key].values.length == 0) {
                    this.getTable(params.TableName)[Object.values(params.Key)[0]][attr1][attr2][key] = undefined
                }
            } else {
                throw Error("Unsupported UpdateExpression: " + params.UpdateExpression)
            }

            return {}
        })
    }
    
    // Default to full table scan for now.
    public scan(params: ScanCommandInput): Promise<ScanCommandOutput> {
        return this.newPromise(() => {
            const table: any[] = Object.values(this.getTable(params.TableName))
            return {
                Items: table,
                Count: table.length,
                ScannedCount: table.length
            }
        })
    }

    private getTable(tableName: string): any {
        if (tableName === MAIN_TABLE) {
            return this.db.main
        } else if (tableName === ITEMS_TABLE) {
            return this.db.items
        } else if (tableName === BATCH_TABLE) {
            return this.db.batch
        } else if (tableName === TAGS_TABLE) {
            return this.db.tags
        } else if (tableName === HISTORY_TABLE) {
            return this.db.history
        } else if (tableName === SCHEDULE_TABLE) {
            return this.db.schedule
        } else if (tableName == TRANSACTIONS_TABLE) {
            return this.db.transactions
        } else {
            throw new Error("Invalid Table Name")
        }
    }

    private newPromise<T>(runnable: () => T): Promise<T & { $metadata: {} }> {
        return new Promise((resolve: (value: T & { $metadata: {} }) => void, reject: (reason?: any) => void) => {
            try {
                const response: T = runnable()
                resolve({ ...response, $metadata: {} })
            } catch (err) {
                reject(err)
            }
        })
    }
}