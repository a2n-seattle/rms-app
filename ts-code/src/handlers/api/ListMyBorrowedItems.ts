import { ListMyBorrowedItems, ListMyBorrowedItemsInput } from "../../api/ListMyBorrowedItems"
import { apiGatewayHandler } from "./APIHelper"

export const handler = apiGatewayHandler((dbClient, metricsClient, input: ListMyBorrowedItemsInput) =>
    new ListMyBorrowedItems(dbClient, metricsClient).execute(input)
)
