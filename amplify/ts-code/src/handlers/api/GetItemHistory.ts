import { Handler } from "aws-lambda"
import { GetItemHistory, GetItemHistoryInput } from "../../api/GetItemHistory"
import { apiHelper } from "./APIHelper"
import { DBClient } from "../../injection/db/DBClient"
import { MetricsClient } from "../../injection/metrics/MetricsClient"
import { HistorySchema } from "../../db/Schemas"

export const handler: Handler = async (event: GetItemHistoryInput): Promise<HistorySchema[]> => {
    return apiHelper((dbClient: DBClient, metricsClient: MetricsClient) => new GetItemHistory(dbClient, metricsClient).execute(event))
}