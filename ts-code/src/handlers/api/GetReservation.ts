import { GetReservation } from "../../api/GetReservation"
import { apiGatewayHandler } from "./APIHelper"

export const handler = apiGatewayHandler((dbClient, metricsClient, input) =>
    new GetReservation(dbClient, metricsClient).execute(input)
)
