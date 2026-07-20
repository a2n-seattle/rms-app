import { Handler } from "aws-lambda"
import { CreateBatch, CreateBatchInput } from "../../api/CreateBatch"
import { DBClient } from "../../injection/db/DBClient"
import { MetricsClient } from "../../injection/metrics/MetricsClient"
import { apiHelper } from "./APIHelper"

export const handler: Handler = async (event: CreateBatchInput): Promise<string> => {
    return apiHelper((dbClient: DBClient, metricsClient: MetricsClient) => new CreateBatch(dbClient, metricsClient).execute(event))
}