import getClients from "../../../../src/handlers/api/APIHelper"
import { handler } from "../../../../src/handlers/api/ListReservations"
import { DBSeed, TestConstants, TestTimestamps } from "../../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../../__dev__/db/LocalDBClient"
import { LocalMetricsClient } from "../../../../__dev__/metrics/LocalMetricsClient"
import { ScheduleSchema } from "../../../../src/db/Schemas"

const RESERVED_SCHEDULE: ScheduleSchema = {
    id: TestConstants.RESERVATION_ID,
    borrower: TestConstants.BORROWER,
    itemIds: [TestConstants.ITEM_ID, TestConstants.ITEM_ID_2],
    startTime: TestTimestamps.START_DATE,
    endTime: TestTimestamps.END_DATE,
    notes: TestConstants.NOTES
}

test('will list reservations correctly when using handler', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const metricsClient: LocalMetricsClient = new LocalMetricsClient()

    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)

    await expect(
        handler({
            body: JSON.stringify({ borrower: TestConstants.BORROWER })
        } as any, null, null)
    ).resolves.toEqual({
        statusCode: 200,
        body: JSON.stringify({
            items: [RESERVED_SCHEDULE],
            nextPageToken: undefined
        })
    })
    metricsClient.assureState(0)
})

test('will fail when borrower is missing using handler', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const metricsClient: LocalMetricsClient = new LocalMetricsClient()

    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)

    await expect(
        handler({ body: JSON.stringify({}) } as any, null, null)
    ).resolves.toEqual({
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required field 'borrower'" })
    })
    metricsClient.assureState(1)
})
