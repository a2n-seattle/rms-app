import getClients from "../../../../src/handlers/api/APIHelper"
import { handler } from "../../../../src/handlers/api/ListHistory"
import { DBSeed, TestConstants } from "../../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../../__dev__/db/LocalDBClient"
import { LocalMetricsClient } from "../../../../__dev__/metrics/LocalMetricsClient"
import { HistorySchema } from "../../../../src/db/Schemas"

const HISTORY_ENTRY_1: HistorySchema = {
    action: "borrow",
    borrower: TestConstants.BORROWER,
    itemId: TestConstants.ITEM_ID,
    id: "1000000000010-123",
    name: TestConstants.DISPLAYNAME,
    notes: TestConstants.NOTES,
    timestamp: 1000000000010
}

const HISTORY_ENTRY_2: HistorySchema = {
    action: "borrow",
    borrower: TestConstants.BORROWER,
    itemId: TestConstants.ITEM_ID_2,
    id: "1000000000010-12345",
    name: TestConstants.NAME_2,
    notes: TestConstants.NOTES,
    timestamp: 1000000000010
}

test('will list history entries correctly when using handler', async () => {
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
            items: [HISTORY_ENTRY_2, HISTORY_ENTRY_1],
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
