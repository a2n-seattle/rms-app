import { ListHistory } from "../../../src/api/ListHistory"
import { DBSeed, TestConstants } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"
import { HistorySchema } from "../../../src/db/Schemas"

const HISTORY_ENTRY_1: HistorySchema = {
    id: "1000000000010-123",
    name: TestConstants.DISPLAYNAME,
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

test('will list history entries for a borrower newest-first when they exist', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_BORROWED)
    const api: ListHistory = new ListHistory(dbClient)

    // Seed's user.history is ["...-123", "...-12345"] (insertion/oldest-first order) --
    // ListHistory reverses it, so entry 2 (the later append) comes back first (GH-370).
    await expect(api.execute({ borrower: TestConstants.BORROWER })).resolves.toEqual({
        items: [HISTORY_ENTRY_2, HISTORY_ENTRY_1],
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

test('will return entries newest-first across a paginated cursor, driven by UserTable.history', async () => {
    const seed: any = {
        main: {}, items: {}, batch: {}, tags: {},
        history: {
            "a": { id: "a", name: "x", itemId: "x", borrower: TestConstants.BORROWER, action: "borrow", notes: "", timestamp: 1 },
            "b": { id: "b", name: "x", itemId: "x", borrower: TestConstants.BORROWER, action: "return", notes: "", timestamp: 2 }
        },
        schedule: {}, transactions: {},
        // "a" was recorded before "b" (insertion/oldest-first order, matching UserTable.addHistory's
        // list_append) -- ListHistory should reverse this so "b" (the newer entry) comes first.
        user: { [TestConstants.BORROWER]: { id: TestConstants.BORROWER, owned: [], reserved: [], borrowed: [], history: ["a", "b"] } }
    }
    const dbClient: LocalDBClient = new LocalDBClient(seed)
    const api: ListHistory = new ListHistory(dbClient)

    const page1 = await api.execute({ borrower: TestConstants.BORROWER, limit: 1 })
    expect(page1.items).toEqual([seed.history["b"]])
    expect(page1.nextPageToken).toBeDefined()

    await expect(api.execute({ borrower: TestConstants.BORROWER, limit: 1, pageToken: page1.nextPageToken })).resolves.toEqual({
        items: [seed.history["a"]],
        nextPageToken: undefined
    })
})

test('will surface the most recently recorded entry first even when more history exists than fits in one page (regression, GH-370)', async () => {
    const seed: any = {
        main: {}, items: {}, batch: {}, tags: {},
        history: {
            "oldest": { id: "oldest", name: "x", itemId: "x", borrower: TestConstants.BORROWER, action: "borrow", notes: "", timestamp: 1 },
            "middle": { id: "middle", name: "x", itemId: "x", borrower: TestConstants.BORROWER, action: "return", notes: "", timestamp: 2 },
            "newest": { id: "newest", name: "x", itemId: "x", borrower: TestConstants.BORROWER, action: "borrow", notes: "", timestamp: 3 }
        },
        schedule: {}, transactions: {},
        user: { [TestConstants.BORROWER]: { id: TestConstants.BORROWER, owned: [], reserved: [], borrowed: [], history: ["oldest", "middle", "newest"] } }
    }
    const dbClient: LocalDBClient = new LocalDBClient(seed)
    const api: ListHistory = new ListHistory(dbClient)

    await expect(api.execute({ borrower: TestConstants.BORROWER, limit: 3 })).resolves.toEqual({
        items: [seed.history["newest"], seed.history["middle"], seed.history["oldest"]],
        nextPageToken: undefined
    })
})

test('will return no items when the borrower has no UserTable row yet', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const api: ListHistory = new ListHistory(dbClient)

    await expect(api.execute({ borrower: TestConstants.BORROWER })).resolves.toEqual({
        items: [],
        nextPageToken: undefined
    })
})
