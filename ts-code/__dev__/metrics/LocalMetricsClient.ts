import { MetricsClient } from "../../src/injection/metrics/MetricsClient"

export class LocalMetricsClient implements MetricsClient {
    private duration: number[] = []
    private errors: number[] = []

    emitPromiseMetrics<T>(
        executable: () => Promise<T>,
        namespace: string,
        name: string
    ): Promise<T> {
        const startTime: number = Date.now()

            return executable()
                .then(
                    (response: T) => {
                        return this.emitDuration(startTime)
                            .then(() => this.emitErrors(0))
                            .then(() => response)
                    },
                    (reason: any) => {
                        throw this.emitErrors(1)
                            .then(() => { throw reason })
                    }
                )
    }

    private emitDuration(startTime: number): Promise<void> {
        return new Promise((resolve) => {
            this.duration.push(Date.now() - startTime)
            resolve()
        })
    }

    private emitErrors(value: 0 | 1): Promise<void> {
        return new Promise((resolve) => {
            this.errors.push(value)
            resolve()
        })
    }

    assureState(value: 0 | 1) {
        expect(this.duration.length).toEqual(1)
        expect(this.errors).toEqual([value])
    }
}