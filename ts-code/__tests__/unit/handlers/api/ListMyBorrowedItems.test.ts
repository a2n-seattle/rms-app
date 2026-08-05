import getClients from "../../../../src/handlers/api/APIHelper"
import { handler } from "../../../../src/handlers/api/ListMyBorrowedItems"
import { DBSeed, TestConstants } from "../../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../../__dev__/db/LocalDBClient"
import { LocalMetricsClient } from "../../../../__dev__/metrics/LocalMetricsClient"
import { ItemsSchema } from "../../../../src/db/Schemas"

const BORROWED_ITEM_1: ItemsSchema = {
    id: TestConstants.ITEM_ID,
    name: TestConstants.NAME,
    notes: TestConstants.NOTES,
    borrower: TestConstants.BORROWER,
    history: ["1000000000010-123"],
    schedule: [],
    friendlyName: TestConstants.ITEM_ID,
    borrowTime: 1000000000010,
    returnTime: 0
}

const BORROWED_ITEM_2: ItemsSchema = {
    id: TestConstants.ITEM_ID_2,
    name: TestConstants.NAME_2,
    notes: TestConstants.NOTES_2,
    borrower: TestConstants.BORROWER,
    history: ["1000000000010-12345"],
    schedule: [],
    friendlyName: TestConstants.ITEM_ID_2,
    borrowTime: 1000000000010,
    returnTime: 0
}

test('will list borrowed items correctly when using handler', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_BORROWED)
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
            items: [BORROWED_ITEM_1, BORROWED_ITEM_2],
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
