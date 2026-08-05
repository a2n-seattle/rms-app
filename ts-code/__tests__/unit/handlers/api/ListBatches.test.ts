import getClients from "../../../../src/handlers/api/APIHelper"
import { handler } from "../../../../src/handlers/api/ListBatches"
import { DBSeed, TestConstants } from "../../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../../__dev__/db/LocalDBClient"
import { LocalMetricsClient } from "../../../../__dev__/metrics/LocalMetricsClient"
import { BatchSchema } from "../../../../src/db/Schemas"

const TEST_BATCH: BatchSchema = {
    id: TestConstants.BATCH,
    val: ["123", "12345"],
    groups: [TestConstants.GROUP]
}

test('will list batches correctly when using handler', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH)
    const metricsClient: LocalMetricsClient = new LocalMetricsClient()

    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)

    await expect(
        handler({
            body: JSON.stringify({})
        } as any, null, null)
    ).resolves.toEqual({
        statusCode: 200,
        body: JSON.stringify({
            items: [TEST_BATCH],
            nextPageToken: undefined
        })
    })
    metricsClient.assureState(0)
})
