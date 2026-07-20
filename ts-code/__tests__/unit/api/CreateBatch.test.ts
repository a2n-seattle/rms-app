import { CreateBatch } from "../../../src/api/CreateBatch"
import { DBSeed, TestConstants } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"

test('will create batch correctly when items exist', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES)
    const api: CreateBatch = new CreateBatch(dbClient)

    await expect(
        api.execute({
            name: TestConstants.BATCH,
            ids: [ TestConstants.ITEM_ID, TestConstants.ITEM_ID_2 ],
            groups: [ TestConstants.GROUP ]
        })
    ).resolves.toEqual(`Successfully created batch '${TestConstants.BATCH}'`)
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH)
})

test('will override existing batch when batch already exist', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH)
    const api: CreateBatch = new CreateBatch(dbClient)

    await expect(
        api.execute({
            name: TestConstants.BATCH,
            ids: [ TestConstants.ITEM_ID ],
            groups: [ TestConstants.GROUP ]
        })
    ).resolves.toEqual(`Successfully created batch '${TestConstants.BATCH}'`)
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH_MODIFIED)
})

test('will create batch correctly when a batch already exists', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH)
    const api: CreateBatch = new CreateBatch(dbClient)

    await expect(
        api.execute({
            name: TestConstants.BATCH_2,
            ids: [ TestConstants.ITEM_ID ],
            groups: [ TestConstants.GROUP ]
        })
    ).resolves.toEqual(`Successfully created batch '${TestConstants.BATCH_2}'`)
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_TWO_BATCH)
})

test('will fail to create batch when id is invalid', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES)
    const api: CreateBatch = new CreateBatch(dbClient)
    
    await expect(
        api.execute({
            name: TestConstants.BATCH,
            ids: [ TestConstants.ITEM_ID, TestConstants.ITEM_ID_2, TestConstants.BAD_REQUEST ],
            groups: [ TestConstants.GROUP ]
        })
    ).rejects.toThrow(`Unable to find id '${TestConstants.BAD_REQUEST}'`)
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES)
})

test('will fail to create batch when item name not passed in', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES)
    const api: CreateBatch = new CreateBatch(dbClient)

    await expect(
        api.execute({
            ids: [ TestConstants.ITEM_ID, TestConstants.ITEM_ID_2 ],
            groups: [ TestConstants.GROUP ]
        })
    ).rejects.toThrow("Missing required field 'name'")
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES)
})

test('will fail to create batch when item ids not passed in', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES)
    const api: CreateBatch = new CreateBatch(dbClient)

    await expect(
        api.execute({
            name: TestConstants.BATCH,
            groups: [ TestConstants.GROUP ]
        })
    ).rejects.toThrow("Missing required field 'ids'")
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES)
})