import getClients from "../../../../src/handlers/api/APIHelper"
import { handler } from "../../../../src/handlers/api/ListMyOwnedItems"
import { DBSeed, TestConstants } from "../../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../../__dev__/db/LocalDBClient"
import { LocalMetricsClient } from "../../../../__dev__/metrics/LocalMetricsClient"
import { MainSchema } from "../../../../src/db/Schemas"

const OWNED_MAIN: MainSchema = {
    id: TestConstants.NAME,
    displayName: TestConstants.DISPLAYNAME,
    description: TestConstants.DESCRIPTION,
    items: ["123", "12345"],
    tags: ["tag1"],
    owner: TestConstants.OWNER,
    location: TestConstants.LOCATION,
    batch: []
}

test('will list owned items correctly when using handler', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME_TWO_ITEMS)
    const metricsClient: LocalMetricsClient = new LocalMetricsClient()

    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)

    await expect(
        handler({
            body: JSON.stringify({ owner: TestConstants.OWNER })
        } as any, null, null)
    ).resolves.toEqual({
        statusCode: 200,
        body: JSON.stringify({
            items: [OWNED_MAIN],
            nextPageToken: undefined
        })
    })
    metricsClient.assureState(0)
})

test('will fail when owner is missing using handler', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const metricsClient: LocalMetricsClient = new LocalMetricsClient()

    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)

    await expect(
        handler({ body: JSON.stringify({}) } as any, null, null)
    ).resolves.toEqual({
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required field 'owner'" })
    })
    metricsClient.assureState(1)
})
