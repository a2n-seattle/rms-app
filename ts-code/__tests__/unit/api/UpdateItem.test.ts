import { UpdateItem } from "../../../src/api/UpdateItem"
import { MainTable } from "../../../src/db/MainTable"
import { DBSeed, TestConstants } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"

test('will update name and keep nameKey in sync', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const api: UpdateItem = new UpdateItem(dbClient)
    const mainTable: MainTable = new MainTable(dbClient)

    await expect(
        api.execute({ id: TestConstants.ID, name: TestConstants.NAME_2 })
    ).resolves.toEqual(TestConstants.ID)

    await expect(mainTable.get(TestConstants.ID)).resolves.toMatchObject({
        name: TestConstants.NAME_2,
        nameKey: TestConstants.NAME_2.toLowerCase()
    })
})

test('will update description', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const api: UpdateItem = new UpdateItem(dbClient)
    const mainTable: MainTable = new MainTable(dbClient)

    await api.execute({ id: TestConstants.ID, description: TestConstants.DESCRIPTION_2 })

    await expect(mainTable.get(TestConstants.ID)).resolves.toMatchObject({
        description: TestConstants.DESCRIPTION_2
    })
})

test('will update location', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const api: UpdateItem = new UpdateItem(dbClient)
    const mainTable: MainTable = new MainTable(dbClient)

    await api.execute({ id: TestConstants.ID, location: TestConstants.LOCATION_2 })

    await expect(mainTable.get(TestConstants.ID)).resolves.toMatchObject({
        location: TestConstants.LOCATION_2
    })
})

test('will leave unspecified fields untouched', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const api: UpdateItem = new UpdateItem(dbClient)
    const mainTable: MainTable = new MainTable(dbClient)

    await api.execute({ id: TestConstants.ID, description: TestConstants.DESCRIPTION_2 })

    await expect(mainTable.get(TestConstants.ID)).resolves.toMatchObject({
        name: TestConstants.DISPLAYNAME,
        location: TestConstants.LOCATION
    })
})

test('will fail when id is missing', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const api: UpdateItem = new UpdateItem(dbClient)

    await expect(
        api.execute({ name: TestConstants.NAME_2 })
    ).rejects.toThrow("Missing required field 'id'")
})
