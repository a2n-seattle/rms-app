import { ListItems, ListItemsInput } from "../../api/ListItems"
import { apiGatewayHandler } from "./APIHelper"

export const handler = apiGatewayHandler((dbClient, metricsClient, input: ListItemsInput) =>
    new ListItems(dbClient, metricsClient).execute(input)
)
