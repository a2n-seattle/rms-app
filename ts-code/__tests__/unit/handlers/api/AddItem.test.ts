import { AddItem } from "../../../../src/api/AddItem"
import { MainTable } from "../../../../src/db/MainTable"
import getClients from "../../../../src/handlers/api/APIHelper"
import { handler } from "../../../../src/handlers/api/AddItem"
import { DBSeed, TestConstants } from "../../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../../__dev__/db/LocalDBClient"
import { LocalMetricsClient } from "../../../../__dev__/metrics/LocalMetricsClient"

test('will add item correctly when using handler', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const metricsClient: LocalMetricsClient = new LocalMetricsClient()

    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)

    // Mock IDs
    MainTable.prototype["generateId"] = jest.fn(() => TestConstants.ID);
    AddItem.prototype.getUniqueId = jest.fn(() => Promise.resolve(TestConstants.ITEM_ID));

    await expect(
        handler({
            body: JSON.stringify({
            id: TestConstants.ITEM_ID,
            name: TestConstants.DISPLAYNAME,
            description: TestConstants.DESCRIPTION,
            tags: [TestConstants.TAG],
            owner: TestConstants.OWNER,
            location: TestConstants.LOCATION,
            notes: TestConstants.NOTES
        })
        } as any, null, null)
    ).resolves.toEqual({ statusCode: 200, body: JSON.stringify(`${TestConstants.ITEM_ID}`) })
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME)
    metricsClient.assureState(0)
})