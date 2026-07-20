import { Handler } from "aws-lambda"
import { CreateReservation, CreateReservationInput } from "../../api/CreateReservation"
import { DBClient } from "../../injection/db/DBClient"
import { MetricsClient } from "../../injection/metrics/MetricsClient"
import { apiHelper } from "./APIHelper"

export const handler: Handler = async (event: CreateReservationInput): Promise<string> => {
    return apiHelper((dbClient: DBClient, metricsClient: MetricsClient) => new CreateReservation(dbClient, metricsClient).execute(event))
}