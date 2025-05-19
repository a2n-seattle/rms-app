import { Handler } from "aws-lambda"
import { apiHelper } from "./APIHelper"
import { DBClient } from "../../injection/db/DBClient"
import { MetricsClient } from "../../injection/metrics/MetricsClient"
import { GetReservation, GetReservationInput } from "../../api/GetReservation"
import { ScheduleSchema } from "../../db/Schemas"

export const handler: Handler = async (scratch: GetReservationInput): Promise<ScheduleSchema> => {
    return apiHelper((dbClient: DBClient, metricsClient: MetricsClient) => new GetReservation(dbClient, metricsClient).execute(scratch))
}