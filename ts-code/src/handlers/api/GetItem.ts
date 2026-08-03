import { GetItem } from "../../api/GetItem"
import { apiGatewayHandler } from "./APIHelper"

export const handler = apiGatewayHandler((dbClient, metricsClient, input) =>
    new GetItem(dbClient, metricsClient).execute(input)
)
