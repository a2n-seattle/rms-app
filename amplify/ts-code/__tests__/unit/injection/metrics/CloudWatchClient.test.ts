import { CloudWatchClient } from "../../../../src/injection/metrics/CloudWatchClient"

function stubPutMetricData(client: CloudWatchClient): void {
    // @ts-ignore - reach into the private CloudWatch SDK instance to avoid real network calls
    client["cw"].putMetricData = jest.fn().mockReturnValue(Promise.resolve({}))
}

test('resolves with the executable result on success', async () => {
    const client: CloudWatchClient = new CloudWatchClient("Test")
    stubPutMetricData(client)

    await expect(
        client.emitPromiseMetrics(() => Promise.resolve("ok"), "api", "TestOp")
    ).resolves.toEqual("ok")
})

test('rejects with the original error, not a Promise, when the executable rejects', async () => {
    const client: CloudWatchClient = new CloudWatchClient("Test")
    stubPutMetricData(client)

    const originalError: Error = new Error("invalid item id")

    await expect(
        client.emitPromiseMetrics(() => Promise.reject(originalError), "api", "TestOp")
    ).rejects.toBe(originalError)
})
