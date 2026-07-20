import { Handler } from "aws-lambda"
import { DeleteReservation, DeleteReservationInput } from "../../api/DeleteReservation"
import { DBClient } from "../../injection/db/DBClient"
import { MetricsClient } from "../../injection/metrics/MetricsClient"
import { apiHelper } from "./APIHelper"

export const handler: Handler = async (event: DeleteReservationInput): Promise<string> => {
    return apiHelper((dbClient: DBClient, metricsClient: MetricsClient) => new DeleteReservation(dbClient, metricsClient).execute(event))
}