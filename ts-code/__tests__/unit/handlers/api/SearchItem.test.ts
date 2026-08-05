import getClients from "../../../../src/handlers/api/APIHelper"
import { handler } from "../../../../src/handlers/api/SearchItem"
import { DBSeed, TestConstants } from "../../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../../__dev__/db/LocalDBClient"
import { LocalMetricsClient } from "../../../../__dev__/metrics/LocalMetricsClient"

test('will search item by tags correctly when using handler', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES)
    const metricsClient: LocalMetricsClient = new LocalMetricsClient()

    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)

    await expect(
        handler({
            body: JSON.stringify({ tags: [TestConstants.TAG_2] })
        } as any, null, null)
    ).resolves.toEqual({
        statusCode: 200,
        body: JSON.stringify({
            map: { [TestConstants.ID_2]: { id: TestConstants.ID_2, occurrences: 1, relevance: 0 } },
            entries: [{
                id: TestConstants.ID_2,
                description: TestConstants.DESCRIPTION_2,
                items: [TestConstants.ITEM_ID_2],
                tags: [TestConstants.TAG, TestConstants.TAG_2],
                owner: TestConstants.OWNER_2,
                location: TestConstants.LOCATION_2,
                batch: [],
                nameKey: TestConstants.NAME_2,
                name: TestConstants.NAME_2
            }]
        })
    })
    metricsClient.assureState(0)
})

test('will return no matches when no tags match using handler', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const metricsClient: LocalMetricsClient = new LocalMetricsClient()

    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)

    await expect(
        handler({
            body: JSON.stringify({ tags: [TestConstants.TAG] })
        } as any, null, null)
    ).resolves.toEqual({
        statusCode: 200,
        body: JSON.stringify({ map: {}, entries: [] })
    })
    metricsClient.assureState(0)
})
