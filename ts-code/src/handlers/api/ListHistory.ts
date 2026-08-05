import { ListHistory, ListHistoryInput } from "../../api/ListHistory"
import { apiGatewayHandler } from "./APIHelper"

export const handler = apiGatewayHandler((dbClient, metricsClient, input: ListHistoryInput) =>
    new ListHistory(dbClient, metricsClient).execute(input)
)
