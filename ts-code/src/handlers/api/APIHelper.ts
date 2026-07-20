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
        .catch((reason: any) => {
            return reason
        })
}