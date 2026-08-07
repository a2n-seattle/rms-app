import { UpdateItem, UpdateItemInput } from "../../api/UpdateItem"
import { apiGatewayHandler } from "./APIHelper"

export const handler = apiGatewayHandler((dbClient, metricsClient, input: UpdateItemInput) =>
    new UpdateItem(dbClient, metricsClient).execute(input)
)
