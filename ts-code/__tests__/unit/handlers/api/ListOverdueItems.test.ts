import getClients from "../../../../src/handlers/api/APIHelper"
import { handler } from "../../../../src/handlers/api/ListOverdueItems"
import { DBSeed, TestConstants } from "../../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../../__dev__/db/LocalDBClient"
import { LocalMetricsClient } from "../../../../__dev__/metrics/LocalMetricsClient"
import { ItemsSchema } from "../../../../src/db/Schemas"

const OVERDUE_ITEM: ItemsSchema = {
    id: TestConstants.ITEM_ID,
    name: TestConstants.NAME,
    notes: TestConstants.NOTES,
    borrower: TestConstants.BORROWER,
    history: ["1000000000010-123"],
    schedule: ["123-12345"],
    friendlyName: TestConstants.ITEM_ID,
    borrowTime: 1000000000010,
    returnTime: 0
}

test('will list overdue items correctly when using handler', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_BORROWED_OVERDUE)
    const metricsClient: LocalMetricsClient = new LocalMetricsClient()

    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)

    await expect(
        handler({
            body: JSON.stringify({ borrower: TestConstants.BORROWER })
        } as any, null, null)
    ).resolves.toEqual({
        statusCode: 200,
        body: JSON.stringify({
            items: [OVERDUE_ITEM],
            nextPageToken: undefined
        })
    })
    metricsClient.assureState(0)
})

test('will fail when borrower is missing using handler', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const metricsClient: LocalMetricsClient = new LocalMetricsClient()

    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)

    await expect(
        handler({ body: JSON.stringify({}) } as any, null, null)
    ).resolves.toEqual({
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required field 'borrower'" })
    })
    metricsClient.assureState(1)
})
