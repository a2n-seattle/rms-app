import { BorrowItem } from "../../../src/api/BorrowItem"
import { DBSeed, TestConstants, TestTimestamps } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"

test('will borrow item correctly when id exists', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const api: BorrowItem = new BorrowItem(dbClient)
    
    // Mock Date
    Date.now = jest.fn(() => TestTimestamps.BORROW_ITEM)

    await expect(
        api.execute({
            ids: [ TestConstants.ITEM_ID ],
            borrower: TestConstants.BORROWER,
            notes: TestConstants.NOTES
        })
    ).resolves.toEqual(`Successfully borrowed items '${TestConstants.ITEM_ID}'.`)
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME_BORROWED)
})

test('will fail to borrow item when item already borrowed', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME_BORROWED)
    const api: BorrowItem = new BorrowItem(dbClient)
    
    // Mock Date
    Date.now = jest.fn(() => TestTimestamps.BORROW_ITEM)

    await expect(
        api.execute({
            ids: [ TestConstants.ITEM_ID ],
            borrower: TestConstants.BORROWER,
            notes: TestConstants.NOTES
        }).then(() => dbClient.getDB())
    ).rejects.toThrow(`Unable to borrow item: Item is currently being borrowed by '${TestConstants.BORROWER}'.`)
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME_BORROWED)
})

test('will fail to borrow item when id does not exist', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const api: BorrowItem = new BorrowItem(dbClient)
    
    // Mock Date
    Date.now = jest.fn(() => TestTimestamps.BORROW_ITEM)

    await expect(
        api.execute({
            ids: [ TestConstants.BAD_REQUEST ],
            borrower: TestConstants.BORROWER,
            notes: TestConstants.NOTES
        }).then(() => dbClient.getDB())
    ).rejects.toThrow(`Couldn't find item ${TestConstants.BAD_REQUEST} in the database.`)
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME)
})

test('will fail to borrow item  when item ids not passed in', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const api: BorrowItem = new BorrowItem(dbClient)

    // Mock Date
    Date.now = jest.fn(() => TestTimestamps.BORROW_ITEM)

    await expect(
        api.execute({
            borrower: TestConstants.BORROWER,
            notes: TestConstants.NOTES
        })
    ).rejects.toThrow("Missing required field 'ids'")
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME)
})

test('will fail to borrow item when item borrower not passed in', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const api: BorrowItem = new BorrowItem(dbClient)

    // Mock Date
    Date.now = jest.fn(() => TestTimestamps.BORROW_ITEM)

    await expect(
        api.execute({
            ids: [ TestConstants.ITEM_ID ],
            notes: TestConstants.NOTES
        })
    ).rejects.toThrow("Missing required field 'borrower'")
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME)
})