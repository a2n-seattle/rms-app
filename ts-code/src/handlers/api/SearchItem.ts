import { SearchItem } from "../../api/SearchItem"
import { apiGatewayHandler } from "./APIHelper"

export const handler = apiGatewayHandler((dbClient, metricsClient, input) =>
    new SearchItem(dbClient, metricsClient).execute(input)
)
