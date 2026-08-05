import { MainTable } from "../../../src/db/MainTable"
import { DBSeed, TestConstants } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"

beforeEach(() => {
    MainTable.prototype["generateId"] = jest.fn(() => TestConstants.ID)
})

test('will create main entry with owner, location, and empty batch', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const table: MainTable = new MainTable(dbClient)

    const id = await table.create(TestConstants.DISPLAYNAME, TestConstants.DESCRIPTION, TestConstants.OWNER, TestConstants.LOCATION)
    expect(id).toEqual(TestConstants.ID)

    await expect(table.get(TestConstants.ID)).resolves.toEqual({
        id: TestConstants.ID,
        nameKey: TestConstants.NAME,
        name: TestConstants.DISPLAYNAME,
        description: TestConstants.DESCRIPTION,
        owner: TestConstants.OWNER,
        location: TestConstants.LOCATION,
        batch: [],
        tags: [],
        items: []
    })
})

test('will create main entry with no type field when type is omitted', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const table: MainTable = new MainTable(dbClient)

    await table.create(TestConstants.DISPLAYNAME, TestConstants.DESCRIPTION, TestConstants.OWNER, TestConstants.LOCATION)

    const entry = await table.get(TestConstants.ID)
    expect(entry.type).toBeUndefined()
})

test('will create main entry with type "room" when specified', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const table: MainTable = new MainTable(dbClient)

    await table.create(TestConstants.DISPLAYNAME, TestConstants.DESCRIPTION, TestConstants.OWNER, TestConstants.LOCATION, "room")

    await expect(table.get(TestConstants.ID)).resolves.toEqual({
        id: TestConstants.ID,
        nameKey: TestConstants.NAME,
        name: TestConstants.DISPLAYNAME,
        description: TestConstants.DESCRIPTION,
        owner: TestConstants.OWNER,
        location: TestConstants.LOCATION,
        batch: [],
        tags: [],
        items: [],
        type: "room"
    })
})

test('will find main entry by name via getByName', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const table: MainTable = new MainTable(dbClient)

    await expect(table.getByName(TestConstants.NAME)).resolves.toMatchObject({ id: TestConstants.ID })
})

test('will return undefined from getByName when no entry matches', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const table: MainTable = new MainTable(dbClient)

    await expect(table.getByName(TestConstants.NAME)).resolves.toBeUndefined()
})

test('will find main entry by name via getByNameConsistent', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const table: MainTable = new MainTable(dbClient)

    await expect(table.getByNameConsistent(TestConstants.NAME)).resolves.toMatchObject({ id: TestConstants.ID })
})
