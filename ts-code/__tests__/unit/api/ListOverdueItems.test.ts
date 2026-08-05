import { ListOverdueItems } from "../../../src/api/ListOverdueItems"
import { DBSeed, TestConstants } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"
import { ItemsSchema } from "../../../src/db/Schemas"

const OVERDUE_ITEM: ItemsSchema = {
    id: TestConstants.ITEM_ID,
    familyId: TestConstants.ID,
    name: TestConstants.ITEM_ID,
    notes: TestConstants.NOTES,
    borrower: TestConstants.BORROWER,
    borrowTime: 1000000000010,
    returnTime: 0,
    history: ["1000000000010-123"],
    schedule: ["123-12345"]
}

test('will list items overdue for a borrower when they exist', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_BORROWED_OVERDUE)
    const api: ListOverdueItems = new ListOverdueItems(dbClient)

    await expect(api.execute({ borrower: TestConstants.BORROWER })).resolves.toEqual({
        items: [OVERDUE_ITEM],
        nextPageToken: undefined
    })
})

test('will not list borrowed items whose schedule is not yet overdue', async () => {
    // TWO_NAMES_ONE_BATCH_BORROWED has borrowed items with no linked
    // schedule entries at all, so nothing can be overdue.
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_BORROWED)
    const api: ListOverdueItems = new ListOverdueItems(dbClient)

    await expect(api.execute({ borrower: TestConstants.BORROWER })).resolves.toEqual({
        items: [],
        nextPageToken: undefined
    })
})

test('will return no items when borrower does not match', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_BORROWED_OVERDUE)
    const api: ListOverdueItems = new ListOverdueItems(dbClient)

    await expect(api.execute({ borrower: TestConstants.BORROWER_2 })).resolves.toEqual({
        items: [],
        nextPageToken: undefined
    })
})

test('will fail when borrower is missing', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_BORROWED_OVERDUE)
    const api: ListOverdueItems = new ListOverdueItems(dbClient)

    await expect(api.execute({})).rejects.toThrow("Missing required field 'borrower'")
})

test('will find an overdue match scanned after more than `limit` non-matching items (regression, GH-357)', async () => {
    const seed: any = {
        main: {},
        items: {
            "a-nomatch": { id: "a-nomatch", familyId: "f", name: "a-nomatch", notes: "", borrower: "someone-else", borrowTime: 0, returnTime: 0, history: [], schedule: [] },
            "b-nomatch": { id: "b-nomatch", familyId: "f", name: "b-nomatch", notes: "", borrower: "someone-else", borrowTime: 0, returnTime: 0, history: [], schedule: [] },
            "z-match": { id: "z-match", familyId: "f", name: "z-match", notes: "", borrower: TestConstants.BORROWER, borrowTime: 0, returnTime: 0, history: [], schedule: ["sched-1"] }
        },
        batch: {}, tags: {},
        history: {},
        schedule: {
            "sched-1": { id: "sched-1", borrower: TestConstants.BORROWER, itemIds: ["z-match"], startTime: 0, endTime: 1 }
        },
        transactions: {}, user: {}
    }
    const dbClient: LocalDBClient = new LocalDBClient(seed)
    const api: ListOverdueItems = new ListOverdueItems(dbClient)

    await expect(api.execute({ borrower: TestConstants.BORROWER, limit: 1 })).resolves.toEqual({
        items: [seed.items["z-match"]],
        nextPageToken: undefined
    })
})
