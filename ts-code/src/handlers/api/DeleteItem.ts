import { Handler } from "aws-lambda"
import { DeleteItem, DeleteItemInput } from "../../api/DeleteItem"
import { DBClient } from "../../injection/db/DBClient"
import { MetricsClient } from "../../injection/metrics/MetricsClient"
import { apiHelper } from "./APIHelper"

export const handler: Handler = async (event: DeleteItemInput): Promise<string> => {
    return apiHelper((dbClient: DBClient, metricsClient: MetricsClient) => new DeleteItem(dbClient, metricsClient).execute(event))
}