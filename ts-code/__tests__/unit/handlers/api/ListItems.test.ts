import getClients from "../../../../src/handlers/api/APIHelper"
import { handler } from "../../../../src/handlers/api/ListItems"
import { DBSeed, TestConstants } from "../../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../../__dev__/db/LocalDBClient"
import { LocalMetricsClient } from "../../../../__dev__/metrics/LocalMetricsClient"

test('will list items correctly when using handler', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const metricsClient: LocalMetricsClient = new LocalMetricsClient()

    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)

    await expect(
        handler({ body: JSON.stringify({}) } as any, null, null)
    ).resolves.toEqual({
        statusCode: 200,
        body: JSON.stringify({
            items: [{
                id: TestConstants.NAME,
                displayName: TestConstants.DISPLAYNAME,
                description: TestConstants.DESCRIPTION,
                items: [TestConstants.ITEM_ID],
                tags: [TestConstants.TAG],
                owner: TestConstants.OWNER,
                location: TestConstants.LOCATION,
                batch: []
            }],
            nextPageToken: undefined
        })
    })
    metricsClient.assureState(0)
})
