import { ReturnItem } from "../../../src/api/ReturnItem"
import { DBSeed, TestConstants, TestTimestamps } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"

test('will return item correctly when id borrowed', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME_BORROWED)
    const api: ReturnItem = new ReturnItem(dbClient)
    
    // Mock Date
    Date.now = jest.fn(() => TestTimestamps.RETURN_ITEM)

    await expect(
        api.execute({
            ids: [ TestConstants.ITEM_ID ],
            borrower: TestConstants.BORROWER,
            notes: TestConstants.NOTES_2
        })
    ).resolves.toEqual(`Successfully returned items '${TestConstants.ITEM_ID}'.`)
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME_RETURNED)
})

test('will fail to return item when item is not borrowed', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const api: ReturnItem = new ReturnItem(dbClient)
    
    // Mock Date
    Date.now = jest.fn(() => TestTimestamps.RETURN_ITEM)

    await expect(
        api.execute({
            ids: [ TestConstants.ITEM_ID ],
            borrower: TestConstants.BORROWER,
            notes: TestConstants.NOTES_2
        })
    ).rejects.toThrow(`Unable to return item: Borrower in database is '', which isn't equal to the specified borrower of '${TestConstants.BORROWER}'.`)
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME)
})

test('will fail to return item when item is borrowed by somebody else', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME_BORROWED)
    const api: ReturnItem = new ReturnItem(dbClient)
    
    // Mock Date
    Date.now = jest.fn(() => TestTimestamps.RETURN_ITEM)

    await expect(
        api.execute({
            ids: [ TestConstants.ITEM_ID ],
            borrower: TestConstants.BAD_REQUEST,
            notes: TestConstants.NOTES_2
        })
    ).rejects.toThrow(`Unable to return item: Borrower in database is '${TestConstants.BORROWER}', which isn't equal to the specified borrower of '${TestConstants.BAD_REQUEST}'.`)
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME_BORROWED)
})

test('will fail to return item when id does not exist', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME_BORROWED)
    const api: ReturnItem = new ReturnItem(dbClient)
    
    // Mock Date
    Date.now = jest.fn(() => TestTimestamps.RETURN_ITEM)

    await expect(
        api.execute({
            ids: [ TestConstants.BAD_REQUEST ],
            borrower: TestConstants.BORROWER,
            notes: TestConstants.NOTES_2
        })
    ).rejects.toThrow(`Couldn't find item ${TestConstants.BAD_REQUEST} in the database.`)
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME_BORROWED)
})

test('will fail to return item when item ids not passed in', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME_BORROWED)
    const api: ReturnItem = new ReturnItem(dbClient)

    // Mock Date
    Date.now = jest.fn(() => TestTimestamps.RETURN_ITEM)

    await expect(
        api.execute({
            borrower: TestConstants.BORROWER,
            notes: TestConstants.NOTES_2
        })
    ).rejects.toThrow("Missing required field 'ids'")
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME_BORROWED)  // gaurentees DB state is the same start & end
})

test('will fail to return item when item borrower not passed in', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME_BORROWED)
    const api: ReturnItem = new ReturnItem(dbClient)

    // Mock Date
    Date.now = jest.fn(() => TestTimestamps.RETURN_ITEM)

    await expect(
        api.execute({
            ids: [ TestConstants.ITEM_ID ],
            notes: TestConstants.NOTES_2
        })
    ).rejects.toThrow("Missing required field 'borrower'")
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME_BORROWED)
})