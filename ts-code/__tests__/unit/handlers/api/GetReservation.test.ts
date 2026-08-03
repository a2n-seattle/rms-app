import getClients from "../../../../src/handlers/api/APIHelper"
import { handler } from "../../../../src/handlers/api/GetReservation"
import { DBSeed, TestConstants, TestTimestamps } from "../../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../../__dev__/db/LocalDBClient"
import { LocalMetricsClient } from "../../../../__dev__/metrics/LocalMetricsClient"

test('will get reservation correctly when using handler', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const metricsClient: LocalMetricsClient = new LocalMetricsClient()

    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)

    await expect(
        handler({
            body: JSON.stringify({ id: TestConstants.RESERVATION_ID })
        } as any, null, null)
    ).resolves.toEqual({
        statusCode: 200,
        body: JSON.stringify({
            id: TestConstants.RESERVATION_ID,
            borrower: TestConstants.BORROWER,
            itemIds: [TestConstants.ITEM_ID, TestConstants.ITEM_ID_2],
            startTime: TestTimestamps.START_DATE,
            endTime: TestTimestamps.END_DATE,
            notes: TestConstants.NOTES
        })
    })
    metricsClient.assureState(0)
})

test('will fail when reservation is not found using handler', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const metricsClient: LocalMetricsClient = new LocalMetricsClient()

    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)

    await expect(
        handler({
            body: JSON.stringify({ id: TestConstants.RESERVATION_ID })
        } as any, null, null)
    ).resolves.toEqual({
        statusCode: 400,
        body: JSON.stringify({ error: `Reservation not found. id: '${TestConstants.RESERVATION_ID}' is invalid` })
    })
    metricsClient.assureState(1)
})
