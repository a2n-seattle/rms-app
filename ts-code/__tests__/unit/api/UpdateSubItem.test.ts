import { UpdateSubItem } from "../../../src/api/UpdateSubItem"
import { ItemTable } from "../../../src/db/ItemTable"
import { DBSeed, TestConstants } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"

test('will update the friendly name', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const api: UpdateSubItem = new UpdateSubItem(dbClient)
    const itemTable: ItemTable = new ItemTable(dbClient)

    await expect(
        api.execute({ id: TestConstants.ITEM_ID, name: TestConstants.FRIENDLY_NAME })
    ).resolves.toEqual(TestConstants.ITEM_ID)

    await expect(itemTable.get(TestConstants.ITEM_ID)).resolves.toMatchObject({
        name: TestConstants.FRIENDLY_NAME
    })
})

test('will update notes', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const api: UpdateSubItem = new UpdateSubItem(dbClient)
    const itemTable: ItemTable = new ItemTable(dbClient)

    await api.execute({ id: TestConstants.ITEM_ID, notes: TestConstants.NOTES_2 })

    await expect(itemTable.get(TestConstants.ITEM_ID)).resolves.toMatchObject({
        notes: TestConstants.NOTES_2
    })
})

test('will leave unspecified fields untouched', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const api: UpdateSubItem = new UpdateSubItem(dbClient)
    const itemTable: ItemTable = new ItemTable(dbClient)

    await api.execute({ id: TestConstants.ITEM_ID, name: TestConstants.FRIENDLY_NAME })

    await expect(itemTable.get(TestConstants.ITEM_ID)).resolves.toMatchObject({
        notes: TestConstants.NOTES
    })
})

test('will fail when id is missing', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const api: UpdateSubItem = new UpdateSubItem(dbClient)

    await expect(
        api.execute({ name: TestConstants.FRIENDLY_NAME })
    ).rejects.toThrow("Missing required field 'id'")
})
