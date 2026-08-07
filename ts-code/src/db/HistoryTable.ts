import { HISTORY_TABLE, HistorySchema } from "./Schemas"
import { DBClient } from "../injection/db/DBClient"
import { GetCommandInput, GetCommandOutput } from "@aws-sdk/lib-dynamodb"

/**
 * History rows are written directly by ItemTable.changeBorrower/createHistoryEntry (the only
 * writer) -- this class exists solely for the read side, e.g. ListHistory.ts's id-array-driven
 * lookups against UserTable.history.
 */
export class HistoryTable {
    private readonly client: DBClient

    public constructor(client: DBClient) {
        this.client = client
    }

    public get(id: string): Promise<HistorySchema> {
        const params: GetCommandInput = {
            TableName: HISTORY_TABLE,
            Key: {
                "id": id
            }
        }
        return this.client.get(params)
            .then((output: GetCommandOutput) => output.Item as HistorySchema)
    }
}
