import { ListBatches, ListBatchesInput } from "../../api/ListBatches"
import { apiGatewayHandler } from "./APIHelper"

export const handler = apiGatewayHandler((dbClient, metricsClient, input: ListBatchesInput) =>
    new ListBatches(dbClient, metricsClient).execute(input)
)
