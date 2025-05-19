import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { DBClient } from "../injection/db/DBClient";
import { HistorySchema, HISTORY_TABLE } from "./Schemas";

export class HistoryTable {
    private readonly client: DBClient

    public constructor (client: DBClient) {
        this.client = client
    }

    /**
     * Get history by id.
     * @param historyId ID of history
     */
    public get(historyId: string): Promise<HistorySchema> {
        const params: DocumentClient.GetItemInput = {
            TableName: HISTORY_TABLE,
            Key: {
                "id": historyId
            }
        }
        return this.client.get(params)
        .then((output: DocumentClient.GetItemOutput) => output.Item as HistorySchema)
    }
}