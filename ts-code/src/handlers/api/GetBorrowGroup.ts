import { GetBorrowGroup, GetBorrowGroupInput } from "../../api/GetBorrowGroup"
import { apiGatewayHandler } from "./APIHelper"

export const handler = apiGatewayHandler((dbClient, metricsClient, input: GetBorrowGroupInput) =>
    new GetBorrowGroup(dbClient, metricsClient).execute(input)
)
