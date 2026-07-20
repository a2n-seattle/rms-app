import { Handler } from "aws-lambda"
import { ReturnItem, ReturnItemInput } from "../../api/ReturnItem"
import { DBClient } from "../../injection/db/DBClient"
import { MetricsClient } from "../../injection/metrics/MetricsClient"
import { apiHelper } from "./APIHelper"

export const handler: Handler = async (event: ReturnItemInput): Promise<string> => {
    return apiHelper((dbClient: DBClient, metricsClient: MetricsClient) => new ReturnItem(dbClient, metricsClient).execute(event))
}