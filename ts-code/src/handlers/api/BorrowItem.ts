import { Handler } from "aws-lambda"
import { BorrowItem, BorrowItemInput } from "../../api/BorrowItem"
import { DBClient } from "../../injection/db/DBClient"
import { MetricsClient } from "../../injection/metrics/MetricsClient"
import { apiHelper } from "./APIHelper"

export const handler: Handler = async (event: BorrowItemInput): Promise<string> => {
    return apiHelper((dbClient: DBClient, metricsClient: MetricsClient) => new BorrowItem(dbClient, metricsClient).execute(event))
}