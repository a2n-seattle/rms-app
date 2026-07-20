import { MetricsClient } from "../injection/metrics/MetricsClient";

export function emitAPIMetrics<T>(
    executable: () => Promise<T>,
    name: string,
    metrics?: MetricsClient
): Promise<T> {
    if (metrics) {
        return metrics.emitPromiseMetrics(executable, "api", name);
    } else {
        return executable();
    }
}
