import getClients from "../../../../src/handlers/api/APIHelper"
import { handler } from "../../../../src/handlers/api/ReturnItem"
import { DBSeed, TestConstants, TestTimestamps } from "../../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../../__dev__/db/LocalDBClient"
import { LocalMetricsClient } from "../../../../__dev__/metrics/LocalMetricsClient"

test('will return item correctly when using handler', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME_BORROWED)
    const metricsClient: LocalMetricsClient = new LocalMetricsClient()

    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)
    
    // Mock Date
    Date.now = jest.fn(() => TestTimestamps.RETURN_ITEM)
    
    await expect(
        handler({
            ids: [ TestConstants.ITEM_ID ],
            borrower: TestConstants.BORROWER,
            notes: TestConstants.NOTES_2
        }, null, null)
    ).resolves.toEqual(`Successfully returned items '${TestConstants.ITEM_ID}'.`)
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME_RETURNED)
    metricsClient.assureState(0)
})