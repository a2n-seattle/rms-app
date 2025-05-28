import { ReturnObject } from "../../../../src/api/GetItem"
import { ItemsSchema, MainSchema } from "../../../../src/db/Schemas"
import { DBSeed, TestConstants } from "../../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../../__dev__/db/LocalDBClient"
import { LocalMetricsClient } from "../../../../__dev__/metrics/LocalMetricsClient"
import { handler } from "../../../../src/handlers/api/GetItem"
import getClients from "../../../../src/handlers/api/APIHelper"

test('will get item correctly when id exists', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME_TWO_ITEMS)
    const metricsClient: LocalMetricsClient = new LocalMetricsClient()

    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)

    const expectedMain: MainSchema = {
        id: TestConstants.NAME,
        displayName: TestConstants.DISPLAYNAME,
        description: TestConstants.DESCRIPTION,
        tags: [TestConstants.TAG],
        items: [TestConstants.ITEM_ID, TestConstants.ITEM_ID_2]
    }
    const expectedItems: ItemsSchema[] = [
        {
            id: TestConstants.ITEM_ID,
            name: TestConstants.NAME,
            owner: TestConstants.OWNER,
            borrower: "",
            notes: TestConstants.NOTES,
            batch: [],
            history: [],
            schedule: []
        }
    ]
    const expected: ReturnObject = new ReturnObject(expectedMain, expectedItems)
    
    await expect(
        handler({
            key: TestConstants.ITEM_ID
        }, null, null)
    ).resolves.toEqual(expected)
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME_TWO_ITEMS)
})