import { ListOverdueItems, ListOverdueItemsInput } from "../../api/ListOverdueItems"
import { apiGatewayHandler } from "./APIHelper"

export const handler = apiGatewayHandler((dbClient, metricsClient, input: ListOverdueItemsInput) =>
    new ListOverdueItems(dbClient, metricsClient).execute(input)
)
