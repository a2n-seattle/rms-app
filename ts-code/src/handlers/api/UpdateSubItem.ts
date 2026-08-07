import { UpdateSubItem, UpdateSubItemInput } from "../../api/UpdateSubItem"
import { apiGatewayHandler } from "./APIHelper"

export const handler = apiGatewayHandler((dbClient, metricsClient, input: UpdateSubItemInput) =>
    new UpdateSubItem(dbClient, metricsClient).execute(input)
)
