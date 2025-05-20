import { DBSeed, TestConstants, TestTimestamps } from "../../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../../__dev__/db/LocalDBClient"
import { LocalMetricsClient } from "../../../../__dev__/metrics/LocalMetricsClient"
import getClients from "../../../../src/handlers/api/APIHelper"
import { handler } from "../../../../src/handlers/api/BorrowFromSchedule"

test('will borrow item correctly with handler when schedule id exists', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const metricsClient: LocalMetricsClient = new LocalMetricsClient()

    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)
    
    // Mock Date
    Date.now = jest.fn(() => TestTimestamps.BORROW_BATCH)

    let scheduleId: string = TestConstants.RESERVATION_ID

    await expect(
        handler({
            scheduleId: scheduleId, 
            notes: TestConstants.NOTES
        }, null, null)
    ).resolves.toEqual(`Successfully borrowed items from schedule '${scheduleId}'.`)
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH_BORROWED)
    metricsClient.assureState(0)
})