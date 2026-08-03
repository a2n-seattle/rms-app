import { CreateReservation, CreateReservationInput } from "../../api/CreateReservation"
import { apiGatewayHandler } from "./APIHelper"

export const handler = apiGatewayHandler((dbClient, metricsClient, input: CreateReservationInput) =>
    new CreateReservation(dbClient, metricsClient).execute(input)
)
