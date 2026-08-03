import { GetBatch } from "../../api/GetBatch"
import { apiGatewayHandler } from "./APIHelper"

export const handler = apiGatewayHandler((dbClient, metricsClient, input) =>
    new GetBatch(dbClient, metricsClient).executeDetailed(input)
)
