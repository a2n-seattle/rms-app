import { Handler } from "aws-lambda"
import { BorrowFromSchedule, BorrowFromScheduleInput } from "../../api/BorrowFromSchedule"
import { DBClient } from "../../injection/db/DBClient"
import { MetricsClient } from "../../injection/metrics/MetricsClient"
import { apiHelper } from "./APIHelper"

export const handler: Handler = async (event: BorrowFromScheduleInput): Promise<string> => {
    return apiHelper((dbClient: DBClient, metricsClient: MetricsClient) => new BorrowFromSchedule(dbClient, metricsClient).execute(event))
}