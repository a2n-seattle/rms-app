import { UpdateTags } from "../../../src/api/UpdateTags"
import { DBSeed, TestConstants} from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"

test('will update tags correctly when name exists', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const api: UpdateTags = new UpdateTags(dbClient)
    
    await expect(
        api.execute({
            name: TestConstants.NAME,
            tags: [ TestConstants.TAG_2 ]
        })
    ).resolves.toEqual(`Successfully updated tags for '${TestConstants.NAME}'`)
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME_CHANGE_TAGS)
})

test('will throw excpetion when name is invalid', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const api: UpdateTags = new UpdateTags(dbClient)
    
    await expect(
        api.execute({
            name: TestConstants.BAD_REQUEST,
            tags: [ TestConstants.TAG_2 ]
        }).then(() => dbClient.getDB())
    ).rejects.toThrow(`Could not find '${TestConstants.BAD_REQUEST}' in the database.`)
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME)
})

test('will fail to update item tags when name not passed in', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const api: UpdateTags = new UpdateTags(dbClient)

    await expect(
        api.execute({
            tags: [ TestConstants.TAG_2 ]
        })
    ).rejects.toThrow("Missing required field 'name'")
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME)
})

test('will fail to update item tags when tags not passed in', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const api: UpdateTags = new UpdateTags(dbClient)

    await expect(
        api.execute({
            name: TestConstants.NAME,
        })
    ).rejects.toThrow("Missing required field 'tags'")
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME)
})