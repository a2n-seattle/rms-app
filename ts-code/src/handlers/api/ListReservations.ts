import { ListReservations, ListReservationsInput } from "../../api/ListReservations"
import { apiGatewayHandler } from "./APIHelper"

export const handler = apiGatewayHandler((dbClient, metricsClient, input: ListReservationsInput) =>
    new ListReservations(dbClient, metricsClient).execute(input)
)
