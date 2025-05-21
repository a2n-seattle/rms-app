import { DBSeed, TestConstants, TestHistory } from "../../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../../__dev__/db/LocalDBClient"
import { LocalMetricsClient } from "../../../../__dev__/metrics/LocalMetricsClient"
import getClients from "../../../../src/handlers/api/APIHelper"
import { handler } from "../../../../src/handlers/api/GetItemHistory"

test('will get item history correctly when item id exists', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME_BORROWED)
    const metricsClient: LocalMetricsClient = new LocalMetricsClient()
    
    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)

    await expect(
        handler({
            itemId: TestConstants.ITEM_ID
        }, null, null)
    ).resolves.toEqual(TestHistory)
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME_BORROWED)
})