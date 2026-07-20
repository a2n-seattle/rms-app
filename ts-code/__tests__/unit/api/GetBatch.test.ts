import { GetBatch } from "../../../src/api/GetBatch"
import { DBSeed, TestConstants } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"

test('will get batch correctly when batch exist', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_TWO_BATCH)
    const api: GetBatch = new GetBatch(dbClient)

    await expect(
        api.execute({
            name: TestConstants.BATCH
        })
    ).resolves.toEqual([ TestConstants.ITEM_ID, TestConstants.ITEM_ID_2 ])
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_TWO_BATCH)
})

test('will override existing batch when batch already exist', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_TWO_BATCH)
    const api: GetBatch = new GetBatch(dbClient)

    await expect(
        api.execute({
            name: TestConstants.BAD_REQUEST
        })
    ).rejects.toThrow(`Unable to find Batch '${TestConstants.BAD_REQUEST}'`)
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_TWO_BATCH)
})