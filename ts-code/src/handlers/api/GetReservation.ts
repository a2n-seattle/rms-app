import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda"
import { GetReservation } from "../../api/GetReservation"
import { DBClient } from "../../injection/db/DBClient"
import { MetricsClient } from "../../injection/metrics/MetricsClient"
import { apiHelper } from "./APIHelper"

export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
    const input = JSON.parse(event.body ?? "{}")
    return apiHelper((dbClient: DBClient, metricsClient: MetricsClient) => new GetReservation(dbClient, metricsClient).execute(input))
        .then((result) => ({ statusCode: 200, body: JSON.stringify(result) }))
        .catch((error: Error) => ({ statusCode: 400, body: JSON.stringify({ error: error.message }) }))
}
