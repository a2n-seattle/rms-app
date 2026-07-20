import getClients from "../../../../src/handlers/api/APIHelper"
import { handler } from "../../../../src/handlers/api/BorrowItem"
import { DBSeed, TestConstants, TestTimestamps } from "../../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../../__dev__/db/LocalDBClient"
import { LocalMetricsClient } from "../../../../__dev__/metrics/LocalMetricsClient"

test('will borrow item correctly when using handler', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const metricsClient: LocalMetricsClient = new LocalMetricsClient()

    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)
    
    // Mock Date
    Date.now = jest.fn(() => TestTimestamps.BORROW_ITEM)
    
    await expect(
        handler({
            ids: [ TestConstants.ITEM_ID ],
            borrower: TestConstants.BORROWER,
            notes: TestConstants.NOTES
        }, null, null)
    ).resolves.toEqual(`Successfully borrowed items '${TestConstants.ITEM_ID}'.`)
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME_BORROWED)
    metricsClient.assureState(0)
})