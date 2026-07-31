import { MainTable } from "../../../src/db/MainTable"
import { DBSeed, TestConstants } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"

test('will create main entry with owner, location, and empty batch', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const table: MainTable = new MainTable(dbClient)

    await table.create(TestConstants.DISPLAYNAME, TestConstants.DESCRIPTION, TestConstants.OWNER, TestConstants.LOCATION)

    await expect(table.get(TestConstants.NAME)).resolves.toEqual({
        id: TestConstants.NAME,
        displayName: TestConstants.DISPLAYNAME,
        description: TestConstants.DESCRIPTION,
        owner: TestConstants.OWNER,
        location: TestConstants.LOCATION,
        batch: [],
        tags: [],
        items: []
    })
})
