import { DeleteReservation, DeleteReservationInput } from "../../api/DeleteReservation"
import { apiGatewayHandler } from "./APIHelper"

export const handler = apiGatewayHandler((dbClient, metricsClient, input: DeleteReservationInput) =>
    new DeleteReservation(dbClient, metricsClient).execute(input)
)
