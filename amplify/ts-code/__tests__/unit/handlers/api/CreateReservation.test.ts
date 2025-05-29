import { CreateReservation } from "../../../../src/api/CreateReservation"
import getClients from "../../../../src/handlers/api/APIHelper"
import { handler } from "../../../../src/handlers/api/CreateReservation"
import { DBSeed, TestConstants} from "../../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../../__dev__/db/LocalDBClient"
import { LocalMetricsClient } from "../../../../__dev__/metrics/LocalMetricsClient"

test('will create reservation correctly when using handler', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH)
    const metricsClient: LocalMetricsClient = new LocalMetricsClient()

    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)

    // Mock ID
    CreateReservation.prototype.getUniqueId = jest.fn(() => Promise.resolve(TestConstants.RESERVATION_ID));

    await expect(
        handler({
            borrower: TestConstants.BORROWER,
            ids: [TestConstants.ITEM_ID, TestConstants.ITEM_ID_2],
            startTime: TestConstants.START_DATE,
            endTime: TestConstants.END_DATE,
            notes: TestConstants.NOTES
        }, null, null)
    ).resolves.toEqual(TestConstants.RESERVATION_ID)
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    metricsClient.assureState(0)
})