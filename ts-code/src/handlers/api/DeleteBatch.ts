import { DeleteBatch, DeleteBatchInput } from "../../api/DeleteBatch"
import { apiGatewayHandler } from "./APIHelper"

export const handler = apiGatewayHandler((dbClient, metricsClient, input: DeleteBatchInput) =>
    new DeleteBatch(dbClient, metricsClient).execute(input)
)
