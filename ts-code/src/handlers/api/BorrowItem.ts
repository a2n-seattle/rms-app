import { BorrowItem, BorrowItemInput } from "../../api/BorrowItem"
import { apiGatewayHandler } from "./APIHelper"

export const handler = apiGatewayHandler((dbClient, metricsClient, input: BorrowItemInput) =>
    new BorrowItem(dbClient, metricsClient).execute(input)
)
