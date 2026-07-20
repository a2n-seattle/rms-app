export interface MetricsClient {
    /**
     * Emit success and latency metrics for a promise executable to CloudWatch.
     *
     * @param executable Function being executed.
     * @param namespace Namespace of executable
     * @param name Name of executable
     */
    emitPromiseMetrics<T>(executable: () => Promise<T>, namespace: string, name: string): Promise<T>
}
