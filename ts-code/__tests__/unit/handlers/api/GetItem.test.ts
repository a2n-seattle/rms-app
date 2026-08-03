import getClients from "../../../../src/handlers/api/APIHelper"
import { handler } from "../../../../src/handlers/api/GetItem"
import { DBSeed, TestConstants } from "../../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../../__dev__/db/LocalDBClient"
import { LocalMetricsClient } from "../../../../__dev__/metrics/LocalMetricsClient"

test('will get item correctly when using handler', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const metricsClient: LocalMetricsClient = new LocalMetricsClient()

    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)

    await expect(
        handler({
            body: JSON.stringify({ key: TestConstants.ITEM_ID })
        } as any, null, null)
    ).resolves.toEqual({
        statusCode: 200,
        body: JSON.stringify({
            main: {
                id: TestConstants.NAME,
                displayName: TestConstants.DISPLAYNAME,
                description: TestConstants.DESCRIPTION,
                items: [TestConstants.ITEM_ID],
                tags: [TestConstants.TAG],
                owner: TestConstants.OWNER,
                location: TestConstants.LOCATION,
                batch: []
            },
            items: [{
                id: TestConstants.ITEM_ID,
                name: TestConstants.NAME,
                notes: TestConstants.NOTES,
                borrower: "",
                history: [],
                schedule: [],
                friendlyName: TestConstants.ITEM_ID,
                borrowTime: 0,
                returnTime: 0
            }]
        })
    })
    metricsClient.assureState(0)
})

test('will fail when item is not found using handler', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const metricsClient: LocalMetricsClient = new LocalMetricsClient()

    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)

    await expect(
        handler({
            body: JSON.stringify({ key: TestConstants.BAD_REQUEST })
        } as any, null, null)
    ).resolves.toEqual({
        statusCode: 400,
        body: JSON.stringify({ error: `Couldn't find item '${TestConstants.BAD_REQUEST}'` })
    })
    metricsClient.assureState(1)
})
