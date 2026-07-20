import { Handler } from "aws-lambda"
import { DeleteBatch, DeleteBatchInput } from "../../api/DeleteBatch"
import { DBClient } from "../../injection/db/DBClient"
import { MetricsClient } from "../../injection/metrics/MetricsClient"
import { apiHelper } from "./APIHelper"

export const handler: Handler = async (event: DeleteBatchInput): Promise<string> => {
    return apiHelper((dbClient: DBClient, metricsClient: MetricsClient) => new DeleteBatch(dbClient, metricsClient).execute(event))
}