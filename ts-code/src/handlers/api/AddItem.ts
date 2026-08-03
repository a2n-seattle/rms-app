import { AddItem, AddItemInput } from "../../api/AddItem"
import { apiGatewayHandler } from "./APIHelper"

export const handler = apiGatewayHandler((dbClient, metricsClient, input: AddItemInput) =>
    new AddItem(dbClient, metricsClient).execute(input)
)
