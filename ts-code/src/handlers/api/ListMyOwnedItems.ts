import { ListMyOwnedItems, ListMyOwnedItemsInput } from "../../api/ListMyOwnedItems"
import { apiGatewayHandler } from "./APIHelper"

export const handler = apiGatewayHandler((dbClient, metricsClient, input: ListMyOwnedItemsInput) =>
    new ListMyOwnedItems(dbClient, metricsClient).execute(input)
)
