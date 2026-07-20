import { TRANSACTIONS_TABLE } from "./Schemas"
import { DBClient } from "../injection/db/DBClient"
import { DeleteCommandInput, DeleteCommandOutput, GetCommandInput, GetCommandOutput, PutCommandInput, PutCommandOutput, UpdateCommandInput, UpdateCommandOutput } from "@aws-sdk/lib-dynamodb"

export class TransactionsTable {
    private readonly client: DBClient

    public constructor(client: DBClient) {
        this.client = client
    }

    /**
     * Append to scratch space map
     *
     * @param number Phone Number being used for response.
     * @param key Target variable
     * @param val Value to append
     */
    public appendToScratch(
        number: string,
        key: string,
        val: any
    ): Promise<UpdateCommandOutput> {
        const param: UpdateCommandInput = {
            TableName: TRANSACTIONS_TABLE,
            Key: {
                "number": number
            },
            UpdateExpression: "SET #attr.#key = :val",
            ExpressionAttributeNames: {
                "#attr": "scratch",
                "#key": key
            },
            ExpressionAttributeValues: {
                ":val": val
            }
        }
        return this.client.update(param)
    }

    /**
     * Create new Transaction
     *
     * @param number Phone Number being used for response.
     * @param type Type of transaction being performed
     * @param scratch Scratch space used by transactions. Initialized as empty.
     */
    public create(
        number: string,
        type: string
    ): Promise<PutCommandOutput> {
        const params: PutCommandInput = {
            TableName: TRANSACTIONS_TABLE,
            Item: {
                "number": number,
                "type": type,
                "scratch": {}
            }
        }
        return this.client.put(params)
    }

    /**
     * Delete by phone number
     *
     * @param number Phone Number being used for response.
     */
    public delete(
        number: string
    ): Promise<DeleteCommandOutput> {
        const params: DeleteCommandInput = {
            TableName: TRANSACTIONS_TABLE,
            Key: {
                "number": number
            }
        }
        return this.client.delete(params)
    }

    /**
     * Get transaction entry by phone number
     *
     * @param number Phone Number being used for response.
     */
    public get(
        number: string
    ): Promise<GetCommandOutput> {
        const params: GetCommandInput = {
            TableName: TRANSACTIONS_TABLE,
            Key: {
                "number": number
            }
        }
        return this.client.get(params)
    }
}