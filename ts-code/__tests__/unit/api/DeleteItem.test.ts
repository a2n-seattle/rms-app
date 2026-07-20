import { DeleteItem } from "../../../src/api/DeleteItem"
import { DBSeed, TestConstants } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"

test('will delete item correctly when name has single item', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES)
    const api: DeleteItem = new DeleteItem(dbClient)

    await expect(
        api.execute({
            id: TestConstants.ITEM_ID_2,
        })
    ).resolves.toEqual(`Deleted a '${TestConstants.NAME_2}' from the inventory.`)
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME)
})

test('will delete item correctly when name has two items', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME_TWO_ITEMS)
    const api: DeleteItem = new DeleteItem(dbClient)

    await expect(
        api.execute({
            id: TestConstants.ITEM_ID_2,
        })
    ).resolves.toEqual(`Deleted a '${TestConstants.NAME}' from the inventory.`)
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME)
})

test('will throw exception when id is invalid', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const api: DeleteItem = new DeleteItem(dbClient)

    await expect(
        api.execute({
            id: TestConstants.BAD_REQUEST,
        }).then(() => dbClient.getDB())
    ).rejects.toThrow(`Item ${TestConstants.BAD_REQUEST} doesn't exist.`)
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME)
})

test('will fail to delete item when id not passed in', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES)
    const api: DeleteItem = new DeleteItem(dbClient)

    await expect(
        api.execute({
        })
    ).rejects.toThrow("Missing required field 'id'")
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES)
})

