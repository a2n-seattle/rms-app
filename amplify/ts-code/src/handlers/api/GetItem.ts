import { Handler } from "aws-lambda"
import { GetItem, ReturnObject, ScratchInterface } from "../../api/GetItem"
import { apiHelper } from "./APIHelper"
import { DBClient } from "../../injection/db/DBClient"
import { MetricsClient } from "../../injection/metrics/MetricsClient"

export const handler: Handler = async (event: ScratchInterface): Promise<ReturnObject> => {
    return apiHelper((dbClient: DBClient, metricsClient: MetricsClient) => new GetItem(dbClient, metricsClient).execute(event))
}