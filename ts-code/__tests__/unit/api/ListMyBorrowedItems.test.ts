import { ListMyBorrowedItems } from "../../../src/api/ListMyBorrowedItems"
import { DBSeed, TestConstants } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"
import { ItemsSchema } from "../../../src/db/Schemas"

const BORROWED_ITEM_1: ItemsSchema = {
    id: TestConstants.ITEM_ID,
    familyId: TestConstants.ID,
    name: TestConstants.ITEM_ID,
    notes: TestConstants.NOTES,
    borrower: TestConstants.BORROWER,
    borrowTime: 1000000000010,
    returnTime: 0,
    history: ["1000000000010-123"],
    schedule: []
}

const BORROWED_ITEM_2: ItemsSchema = {
    id: TestConstants.ITEM_ID_2,
    familyId: TestConstants.ID_2,
    name: TestConstants.ITEM_ID_2,
    notes: TestConstants.NOTES_2,
    borrower: TestConstants.BORROWER,
    borrowTime: 1000000000010,
    returnTime: 0,
    history: ["1000000000010-12345"],
    schedule: []
}

test('will list items borrowed by a borrower when they exist', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_BORROWED)
    const api: ListMyBorrowedItems = new ListMyBorrowedItems(dbClient)

    await expect(api.execute({ borrower: TestConstants.BORROWER })).resolves.toEqual({
        items: [BORROWED_ITEM_1, BORROWED_ITEM_2],
        nextPageToken: undefined
    })
})

test('will return no items when borrower does not match', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_BORROWED)
    const api: ListMyBorrowedItems = new ListMyBorrowedItems(dbClient)

    await expect(api.execute({ borrower: TestConstants.BORROWER_2 })).resolves.toEqual({
        items: [],
        nextPageToken: undefined
    })
})

test('will fail when borrower is missing', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_BORROWED)
    const api: ListMyBorrowedItems = new ListMyBorrowedItems(dbClient)

    await expect(api.execute({})).rejects.toThrow("Missing required field 'borrower'")
})

test('will return items in order across a paginated cursor, driven by UserTable.borrowed', async () => {
    const seed: any = {
        main: {},
        items: {
            "a": { id: "a", familyId: "f", name: "a", notes: "", borrower: TestConstants.BORROWER, borrowTime: 0, returnTime: 0, history: [], schedule: [] },
            "b": { id: "b", familyId: "f", name: "b", notes: "", borrower: TestConstants.BORROWER, borrowTime: 0, returnTime: 0, history: [], schedule: [] }
        },
        batch: {}, tags: {}, history: {}, schedule: {}, transactions: {},
        user: { [TestConstants.BORROWER]: { id: TestConstants.BORROWER, owned: [], reserved: [], borrowed: ["a", "b"], history: [] } }
    }
    const dbClient: LocalDBClient = new LocalDBClient(seed)
    const api: ListMyBorrowedItems = new ListMyBorrowedItems(dbClient)

    const page1 = await api.execute({ borrower: TestConstants.BORROWER, limit: 1 })
    expect(page1.items).toEqual([seed.items["a"]])
    expect(page1.nextPageToken).toBeDefined()

    await expect(api.execute({ borrower: TestConstants.BORROWER, limit: 1, pageToken: page1.nextPageToken })).resolves.toEqual({
        items: [seed.items["b"]],
        nextPageToken: undefined
    })
})

test('will return no items when the borrower has no UserTable row yet', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const api: ListMyBorrowedItems = new ListMyBorrowedItems(dbClient)

    await expect(api.execute({ borrower: TestConstants.BORROWER })).resolves.toEqual({
        items: [],
        nextPageToken: undefined
    })
})
