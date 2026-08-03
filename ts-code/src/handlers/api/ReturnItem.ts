import { ReturnItem, ReturnItemInput } from "../../api/ReturnItem"
import { apiGatewayHandler } from "./APIHelper"

export const handler = apiGatewayHandler((dbClient, metricsClient, input: ReturnItemInput) =>
    new ReturnItem(dbClient, metricsClient).execute(input)
)
