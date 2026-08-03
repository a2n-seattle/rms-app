import { DeleteItem, DeleteItemInput } from "../../api/DeleteItem"
import { apiGatewayHandler } from "./APIHelper"

export const handler = apiGatewayHandler((dbClient, metricsClient, input: DeleteItemInput) =>
    new DeleteItem(dbClient, metricsClient).execute(input)
)
