import { Handler } from "aws-lambda"
import { AddItem, AddItemInput } from "../../api/AddItem"
import { DBClient } from "../../injection/db/DBClient"
import { MetricsClient } from "../../injection/metrics/MetricsClient"
import { apiHelper } from "./APIHelper"

export const handler: Handler = async (event: AddItemInput): Promise<string> => {
    return apiHelper((dbClient: DBClient, metricsClient: MetricsClient) => new AddItem(dbClient, metricsClient).execute(event))
}