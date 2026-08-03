import { BorrowFromSchedule, BorrowFromScheduleInput } from "../../api/BorrowFromSchedule"
import { apiGatewayHandler } from "./APIHelper"

export const handler = apiGatewayHandler((dbClient, metricsClient, input: BorrowFromScheduleInput) =>
    new BorrowFromSchedule(dbClient, metricsClient).execute(input)
)
