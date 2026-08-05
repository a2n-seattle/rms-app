import { ExtendReservation, ExtendReservationInput } from "../../api/ExtendReservation"
import { apiGatewayHandler } from "./APIHelper"

export const handler = apiGatewayHandler((dbClient, metricsClient, input: ExtendReservationInput) =>
    new ExtendReservation(dbClient, metricsClient).execute(input)
)
