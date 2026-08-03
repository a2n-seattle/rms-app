import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda"
import { DBClient } from "../../injection/db/DBClient";
import { DDBClient } from "../../injection/db/DDBClient";
import { CloudWatchClient } from "../../injection/metrics/CloudWatchClient";
import { MetricsClient } from "../../injection/metrics/MetricsClient";

const db: DBClient = new DDBClient()
const metrics: MetricsClient = new CloudWatchClient("Lambda")

function getDBClient(): DBClient {
    return db
}

function getMetricsClient(): MetricsClient {
    return metrics
}

// Exported for Test Mock
const getClients = {
    getDBClient,
    getMetricsClient
}
export default getClients

export function apiHelper<T>(
    executable: (dbClient: DBClient, metricsClient: MetricsClient) => Promise<T>
): Promise<T>{
    return executable(getClients.getDBClient(), getClients.getMetricsClient())
}

/**
 * Shared handler shape for every API Gateway Lambda: parse the JSON body,
 * run it through apiHelper against the given business logic call, and
 * translate success/failure into the 200/400 JSON envelope every one of
 * these handlers uses. Extracted since every handlers/api/*.ts file was
 * otherwise identical apart from which business logic class/method it
 * wraps.
 */
export function apiGatewayHandler<TInput, TResult>(
    executable: (dbClient: DBClient, metricsClient: MetricsClient, input: TInput) => Promise<TResult>
): APIGatewayProxyHandler {
    return async (event): Promise<APIGatewayProxyResult> => {
        const input: TInput = JSON.parse(event.body ?? "{}")
        return apiHelper((dbClient: DBClient, metricsClient: MetricsClient) => executable(dbClient, metricsClient, input))
            .then((result) => ({ statusCode: 200, body: JSON.stringify(result) }))
            .catch((error: Error) => ({ statusCode: 400, body: JSON.stringify({ error: error.message }) }))
    }
}