import { BatchTable } from "../../../src/db/BatchTable"
import { MainTable } from "../../../src/db/MainTable"
import { DBSeed, TestConstants } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"

beforeEach(() => {
    BatchTable.prototype["generateId"] = jest.fn(() => TestConstants.BATCH_ID)
})

test('will add batch name to the item type\'s Main entry, not the item itself', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const mainTable: MainTable = new MainTable(dbClient)
    const batchTable: BatchTable = new BatchTable(dbClient)

    await batchTable.create(TestConstants.BATCH, [TestConstants.ITEM_ID], [TestConstants.GROUP])

    await expect(mainTable.get(TestConstants.ID)).resolves.toMatchObject({
        batch: [TestConstants.BATCH]
    })
})

test('will remove batch name from the item type\'s Main entry on delete', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const mainTable: MainTable = new MainTable(dbClient)
    const batchTable: BatchTable = new BatchTable(dbClient)

    await batchTable.create(TestConstants.BATCH, [TestConstants.ITEM_ID], [TestConstants.GROUP])
    await batchTable.delete(TestConstants.BATCH)

    await expect(mainTable.get(TestConstants.ID)).resolves.toMatchObject({
        batch: []
    })
})

test('will find batch by name via get, and recreate with a new id', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const batchTable: BatchTable = new BatchTable(dbClient)

    await batchTable.create(TestConstants.BATCH, [TestConstants.ITEM_ID], [TestConstants.GROUP])
    await expect(batchTable.get(TestConstants.BATCH)).resolves.toMatchObject({ id: TestConstants.BATCH_ID })

    BatchTable.prototype["generateId"] = jest.fn(() => TestConstants.BATCH_ID_2)
    await batchTable.delete(TestConstants.BATCH)
    await batchTable.create(TestConstants.BATCH, [TestConstants.ITEM_ID], [TestConstants.GROUP])

    await expect(batchTable.get(TestConstants.BATCH)).resolves.toMatchObject({ id: TestConstants.BATCH_ID_2 })
})
