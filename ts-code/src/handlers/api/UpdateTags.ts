import { Handler } from "aws-lambda"
import { UpdateTags, UpdateTagsInput } from "../../api/UpdateTags"
import { DBClient } from "../../injection/db/DBClient"
import { MetricsClient } from "../../injection/metrics/MetricsClient"
import { apiHelper } from "./APIHelper"

export const handler: Handler = async (event: UpdateTagsInput): Promise<string> => {
    return apiHelper((dbClient: DBClient, metricsClient: MetricsClient) => new UpdateTags(dbClient, metricsClient).execute(event))
}