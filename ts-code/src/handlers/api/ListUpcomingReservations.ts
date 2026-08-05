import { ListUpcomingReservations, ListUpcomingReservationsInput } from "../../api/ListUpcomingReservations"
import { apiGatewayHandler } from "./APIHelper"

export const handler = apiGatewayHandler((dbClient, metricsClient, input: ListUpcomingReservationsInput) =>
    new ListUpcomingReservations(dbClient, metricsClient).execute(input)
)
