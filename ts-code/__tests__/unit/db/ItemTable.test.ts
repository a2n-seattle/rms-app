import { ItemTable } from "../../../src/db/ItemTable"
import { MainTable } from "../../../src/db/MainTable"
import { DBSeed, TestConstants, TestTimestamps } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"

test('will default friendlyName to id when not provided', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const mainTable: MainTable = new MainTable(dbClient)
    const itemTable: ItemTable = new ItemTable(dbClient)

    await mainTable.create(TestConstants.DISPLAYNAME, TestConstants.DESCRIPTION, TestConstants.OWNER, TestConstants.LOCATION)
    await itemTable.create(TestConstants.ITEM_ID, TestConstants.DISPLAYNAME, TestConstants.NOTES)

    await expect(itemTable.get(TestConstants.ITEM_ID)).resolves.toEqual({
        id: TestConstants.ITEM_ID,
        name: TestConstants.NAME,
        friendlyName: TestConstants.ITEM_ID,
        borrower: "",
        borrowTime: 0,
        returnTime: 0,
        notes: TestConstants.NOTES,
        history: [],
        schedule: []
    })
})

test('will use provided friendlyName instead of defaulting to id', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const mainTable: MainTable = new MainTable(dbClient)
    const itemTable: ItemTable = new ItemTable(dbClient)

    await mainTable.create(TestConstants.DISPLAYNAME, TestConstants.DESCRIPTION, TestConstants.OWNER, TestConstants.LOCATION)
    await itemTable.create(TestConstants.ITEM_ID, TestConstants.DISPLAYNAME, TestConstants.NOTES, TestConstants.FRIENDLY_NAME)

    await expect(itemTable.get(TestConstants.ITEM_ID)).resolves.toEqual({
        id: TestConstants.ITEM_ID,
        name: TestConstants.NAME,
        friendlyName: TestConstants.FRIENDLY_NAME,
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
