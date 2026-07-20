import { DeleteBatch } from "../../../src/api/DeleteBatch"
import { DBSeed, TestConstants } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"

test('will delete batch correctly when batch exist', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH)
    const api: DeleteBatch = new DeleteBatch(dbClient)

    await expect(
        api.execute({
            name: TestConstants.BATCH
        })
    ).resolves.toEqual(`Successfully deleted batch '${TestConstants.BATCH}'`)
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES)
})

test('will fail to delete batch when batch does not exist', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH)
    const api: DeleteBatch = new DeleteBatch(dbClient)

    await expect(
        api.execute({
            name: TestConstants.BAD_REQUEST
        })
    ).rejects.toThrow(`Batch '${TestConstants.BAD_REQUEST}' not found`)
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH)
})

test('will fail to delete batch when item name not passed in', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH)
    const api: DeleteBatch = new DeleteBatch(dbClient)

    await expect(
        api.execute({
        })
    ).rejects.toThrow("Missing required field 'name'")
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH)
})