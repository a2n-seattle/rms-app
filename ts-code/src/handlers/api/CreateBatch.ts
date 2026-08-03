import { CreateBatch, CreateBatchInput } from "../../api/CreateBatch"
import { apiGatewayHandler } from "./APIHelper"

export const handler = apiGatewayHandler((dbClient, metricsClient, input: CreateBatchInput) =>
    new CreateBatch(dbClient, metricsClient).execute(input)
)
