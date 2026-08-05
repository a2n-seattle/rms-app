import { ListHistory } from "../../../src/api/ListHistory"
import { DBSeed, TestConstants } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"
import { HistorySchema } from "../../../src/db/Schemas"

const HISTORY_ENTRY_1: HistorySchema = {
    id: "1000000000010-123",
    name: TestConstants.NAME,
    itemId: TestConstants.ITEM_ID,
    borrower: TestConstants.BORROWER,
    action: "borrow",
    notes: TestConstants.NOTES,
    timestamp: 1000000000010
}

const HISTORY_ENTRY_2: HistorySchema = {
    id: "1000000000010-12345",
    name: TestConstants.NAME_2,
    itemId: TestConstants.ITEM_ID_2,
    borrower: TestConstants.BORROWER,
    action: "borrow",
    notes: TestConstants.NOTES,
    timestamp: 1000000000010
}

test('will list history entries for a borrower when they exist', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_BORROWED)
    const api: ListHistory = new ListHistory(dbClient)

    await expect(api.execute({ borrower: TestConstants.BORROWER })).resolves.toEqual({
        items: [HISTORY_ENTRY_1, HISTORY_ENTRY_2],
        nextPageToken: undefined
    })
})

test('will return no items when borrower does not match', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_BORROWED)
    const api: ListHistory = new ListHistory(dbClient)

    await expect(api.execute({ borrower: TestConstants.BORROWER_2 })).resolves.toEqual({
        items: [],
        nextPageToken: undefined
    })
})

test('will fail when borrower is missing', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_BORROWED)
    const api: ListHistory = new ListHistory(dbClient)

    await expect(api.execute({})).rejects.toThrow("Missing required field 'borrower'")
})
