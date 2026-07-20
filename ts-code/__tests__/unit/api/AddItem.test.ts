import { AddItem } from "../../../src/api/AddItem"
import { DBSeed, TestConstants} from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"

test('will add item correctly when name does not exist', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const api: AddItem = new AddItem(dbClient)

    // Mock ID
    AddItem.prototype.getUniqueId = jest.fn(() => Promise.resolve(TestConstants.ITEM_ID));

    await expect(
        api.execute({
            name: TestConstants.DISPLAYNAME,
            description: TestConstants.DESCRIPTION,
            tags: [TestConstants.TAG],
            owner: TestConstants.OWNER,
            notes: TestConstants.NOTES
        })
    ).resolves.toEqual(`${TestConstants.ITEM_ID}`)
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME)
})

test('will add additional item correctly when item already exist', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const api: AddItem = new AddItem(dbClient)

    // Mock ID
    AddItem.prototype.getUniqueId = jest.fn(() => Promise.resolve(TestConstants.ITEM_ID_2));

    await expect(
        api.execute({
            name: TestConstants.DISPLAYNAME,
            description: TestConstants.DESCRIPTION_2,
            tags: [TestConstants.TAG, TestConstants.TAG_2],
            owner: TestConstants.OWNER_2,
            notes: TestConstants.NOTES_2
        })
    ).resolves.toEqual(`${TestConstants.ITEM_ID_2}`)
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME_TWO_ITEMS)
})

test('will fail to add item when id is not unique', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const api: AddItem = new AddItem(dbClient)

    // Mock ID
    AddItem.prototype.getUniqueId = jest.fn(() => Promise.resolve(TestConstants.ITEM_ID));

    await expect(
        api.execute({
            name: TestConstants.DISPLAYNAME,
            description: TestConstants.DESCRIPTION_2,
            tags: [TestConstants.TAG, TestConstants.TAG_2],
            owner: TestConstants.OWNER_2,
            notes: TestConstants.NOTES_2
        })
    ).rejects.toThrow(`RMS ID ${TestConstants.ITEM_ID} is not unique.`)
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME)
})

test('will add different name correctly when name already exists', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const api: AddItem = new AddItem(dbClient)

    // Mock ID
    AddItem.prototype.getUniqueId = jest.fn(() => Promise.resolve(TestConstants.ITEM_ID_2));

    await expect(
        api.execute({
            name: TestConstants.NAME_2,
            description: TestConstants.DESCRIPTION_2,
            tags: [TestConstants.TAG, TestConstants.TAG_2],
            owner: TestConstants.OWNER_2,
            notes: TestConstants.NOTES_2
        })
    ).resolves.toEqual(`${TestConstants.ITEM_ID_2}`)
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES)
})

test('will fail to add name when id is not unique', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const api: AddItem = new AddItem(dbClient)
    
    // Mock ID
    AddItem.prototype.getUniqueId = jest.fn(() => Promise.resolve(TestConstants.ITEM_ID));

    await expect(
        api.execute({
            name: TestConstants.NAME_2,
            description: TestConstants.DESCRIPTION_2,
            tags: [TestConstants.TAG, TestConstants.TAG_2],
            owner: TestConstants.OWNER_2,
            notes: TestConstants.NOTES_2
        })
    ).rejects.toThrow(`RMS ID ${TestConstants.ITEM_ID} is not unique.`)
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_FAIL_CREATE)
})

test('will fail to add item when item name not passed in', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const api: AddItem = new AddItem(dbClient)

    // Mock ID
    AddItem.prototype.getUniqueId = jest.fn(() => Promise.resolve(TestConstants.ITEM_ID));

    await expect(
        api.execute({
            description: TestConstants.DESCRIPTION,
            tags: [TestConstants.TAG],
            owner: TestConstants.OWNER,
            notes: TestConstants.NOTES
        })
    ).rejects.toThrow("Missing required field 'name'")
    expect(dbClient.getDB()).toEqual(DBSeed.EMPTY)
})