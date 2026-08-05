import { ItemTable } from "../../../src/db/ItemTable"
import { MainTable } from "../../../src/db/MainTable"
import { DBSeed, TestConstants, TestTimestamps } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"

beforeEach(() => {
    MainTable.prototype["generateId"] = jest.fn(() => TestConstants.ID)
})

test('will default name to id when not provided', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const mainTable: MainTable = new MainTable(dbClient)
    const itemTable: ItemTable = new ItemTable(dbClient)

    const familyId = await mainTable.create(TestConstants.DISPLAYNAME, TestConstants.DESCRIPTION, TestConstants.OWNER, TestConstants.LOCATION)
    await itemTable.create(TestConstants.ITEM_ID, familyId, TestConstants.NOTES)

    await expect(itemTable.get(TestConstants.ITEM_ID)).resolves.toEqual({
        id: TestConstants.ITEM_ID,
        familyId: TestConstants.ID,
        name: TestConstants.ITEM_ID,
        borrower: "",
        borrowTime: 0,
        returnTime: 0,
        notes: TestConstants.NOTES,
        history: [],
        schedule: []
    })
})

test('will use provided name instead of defaulting to id', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const mainTable: MainTable = new MainTable(dbClient)
    const itemTable: ItemTable = new ItemTable(dbClient)

    const familyId = await mainTable.create(TestConstants.DISPLAYNAME, TestConstants.DESCRIPTION, TestConstants.OWNER, TestConstants.LOCATION)
    await itemTable.create(TestConstants.ITEM_ID, familyId, TestConstants.NOTES, TestConstants.FRIENDLY_NAME)

    await expect(itemTable.get(TestConstants.ITEM_ID)).resolves.toEqual({
        id: TestConstants.ITEM_ID,
        familyId: TestConstants.ID,
        name: TestConstants.FRIENDLY_NAME,
        borrower: "",
        borrowTime: 0,
        returnTime: 0,
        notes: TestConstants.NOTES,
        history: [],
        schedule: []
    })
})

test('will set borrowTime and clear returnTime on borrow', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const itemTable: ItemTable = new ItemTable(dbClient)

    Date.now = jest.fn(() => TestTimestamps.BORROW_ITEM)

    await itemTable.changeBorrower(TestConstants.ITEM_ID, TestConstants.BORROWER, "borrow", TestConstants.NOTES)

    await expect(itemTable.get(TestConstants.ITEM_ID)).resolves.toMatchObject({
        borrower: TestConstants.BORROWER,
        borrowTime: TestTimestamps.BORROW_ITEM,
        returnTime: 0
    })
})

test('will set returnTime and keep borrowTime on return', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME_BORROWED)
    const itemTable: ItemTable = new ItemTable(dbClient)

    Date.now = jest.fn(() => TestTimestamps.RETURN_ITEM)

    await itemTable.changeBorrower(TestConstants.ITEM_ID, TestConstants.BORROWER, "return", TestConstants.NOTES)

    await expect(itemTable.get(TestConstants.ITEM_ID)).resolves.toMatchObject({
        borrower: "",
        borrowTime: TestTimestamps.BORROW_ITEM,
        returnTime: TestTimestamps.RETURN_ITEM
    })
})

test('will record borrowGroupId on borrow when provided', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const itemTable: ItemTable = new ItemTable(dbClient)

    Date.now = jest.fn(() => TestTimestamps.BORROW_ITEM)

    await itemTable.changeBorrower(TestConstants.ITEM_ID, TestConstants.BORROWER, "borrow", TestConstants.NOTES, TestConstants.RESERVATION_ID)

    await expect(itemTable.get(TestConstants.ITEM_ID)).resolves.toMatchObject({
        borrowGroupId: TestConstants.RESERVATION_ID
    })
})

test('will not set borrowGroupId on borrow when not provided', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const itemTable: ItemTable = new ItemTable(dbClient)

    Date.now = jest.fn(() => TestTimestamps.BORROW_ITEM)

    await itemTable.changeBorrower(TestConstants.ITEM_ID, TestConstants.BORROWER, "borrow", TestConstants.NOTES)

    const entry = await itemTable.get(TestConstants.ITEM_ID)
    expect(entry.borrowGroupId).toBeUndefined()
})

test('will clear borrowGroupId on return', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME_BORROWED)
    const itemTable: ItemTable = new ItemTable(dbClient)
    dbClient.getDB().items[TestConstants.ITEM_ID].borrowGroupId = TestConstants.RESERVATION_ID

    Date.now = jest.fn(() => TestTimestamps.RETURN_ITEM)

    await itemTable.changeBorrower(TestConstants.ITEM_ID, TestConstants.BORROWER, "return", TestConstants.NOTES)

    const entry = await itemTable.get(TestConstants.ITEM_ID)
    expect(entry.borrowGroupId).toBeUndefined()
})

test('will record condition on the history entry on return when provided', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME_BORROWED)
    const itemTable: ItemTable = new ItemTable(dbClient)

    Date.now = jest.fn(() => TestTimestamps.RETURN_ITEM)

    await itemTable.changeBorrower(TestConstants.ITEM_ID, TestConstants.BORROWER, "return", TestConstants.NOTES, undefined, "cracked screen")

    const historyKey = `${TestTimestamps.RETURN_ITEM}-${TestConstants.ITEM_ID}`
    await expect(dbClient.getDB().history[historyKey]).toMatchObject({ condition: "cracked screen" })
})

test('will not record condition on the history entry on borrow', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const itemTable: ItemTable = new ItemTable(dbClient)

    Date.now = jest.fn(() => TestTimestamps.BORROW_ITEM)

    await itemTable.changeBorrower(TestConstants.ITEM_ID, TestConstants.BORROWER, "borrow", TestConstants.NOTES, undefined, "cracked screen")

    const historyKey = `${TestTimestamps.BORROW_ITEM}-${TestConstants.ITEM_ID}`
    expect(dbClient.getDB().history[historyKey].condition).toBeUndefined()
})
