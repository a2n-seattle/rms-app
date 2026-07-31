import { BatchTable } from "../../../src/db/BatchTable"
import { MainTable } from "../../../src/db/MainTable"
import { DBSeed, TestConstants } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"

test('will add batch name to the item type\'s Main entry, not the item itself', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const mainTable: MainTable = new MainTable(dbClient)
    const batchTable: BatchTable = new BatchTable(dbClient)

    await batchTable.create(TestConstants.BATCH, [TestConstants.ITEM_ID], [TestConstants.GROUP])

    await expect(mainTable.get(TestConstants.NAME)).resolves.toMatchObject({
        batch: [TestConstants.BATCH]
    })
})

test('will remove batch name from the item type\'s Main entry on delete', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const mainTable: MainTable = new MainTable(dbClient)
    const batchTable: BatchTable = new BatchTable(dbClient)

    await batchTable.create(TestConstants.BATCH, [TestConstants.ITEM_ID], [TestConstants.GROUP])
    await batchTable.delete(TestConstants.BATCH)

    await expect(mainTable.get(TestConstants.NAME)).resolves.toMatchObject({
        batch: []
    })
})
