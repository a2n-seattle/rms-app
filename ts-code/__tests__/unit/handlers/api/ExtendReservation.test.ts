import getClients from "../../../../src/handlers/api/APIHelper"
import { handler } from "../../../../src/handlers/api/ExtendReservation"
import { DBSeed, TestConstants, TestTimestamps } from "../../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../../__dev__/db/LocalDBClient"
import { LocalMetricsClient } from "../../../../__dev__/metrics/LocalMetricsClient"

test('will extend a reservation correctly when using handler', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const metricsClient: LocalMetricsClient = new LocalMetricsClient()

    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)

    const newEndTime = TestTimestamps.END_DATE + 100000

    await expect(
        handler({
            body: JSON.stringify({ id: TestConstants.RESERVATION_ID, newEndTime })
        } as any, null, null)
    ).resolves.toEqual({ statusCode: 200, body: JSON.stringify(TestConstants.RESERVATION_ID) })
    metricsClient.assureState(0)
})

test('will fail when id is missing using handler', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const metricsClient: LocalMetricsClient = new LocalMetricsClient()

    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)

    await expect(
        handler({ body: JSON.stringify({ newEndTime: TestTimestamps.END_DATE }) } as any, null, null)
    ).resolves.toEqual({
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required field 'id'" })
    })
    metricsClient.assureState(1)
})
