import { ScheduleSchema } from "../../../../src/db/Schemas"
import { DBSeed, TestConstants} from "../../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../../__dev__/db/LocalDBClient"
import { LocalMetricsClient } from "../../../../__dev__/metrics/LocalMetricsClient"
import { handler } from "../../../../src/handlers/api/GetReservation"
import getClients from "../../../../src/handlers/api/APIHelper"

test('will get reservation correctly when id is passed in', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const metricsClient: LocalMetricsClient = new LocalMetricsClient()

    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)

    const expectedReservation: ScheduleSchema = {
        id: TestConstants.RESERVATION_ID,
        borrower: TestConstants.BORROWER,
        itemIds: [TestConstants.ITEM_ID, TestConstants.ITEM_ID_2],
        startTime: TestConstants.START_DATE,
        endTime: TestConstants.END_DATE,
        notes: TestConstants.NOTES
    }

    await expect(
        handler({
            id: TestConstants.RESERVATION_ID
        }, null, null)
    ).resolves.toEqual(expectedReservation)
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
})