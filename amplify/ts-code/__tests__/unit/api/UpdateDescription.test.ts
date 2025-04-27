import { UpdateDescription } from "../../../src/api/UpdateDescription"
import { DBSeed, TestConstants } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"

test('will update description correctly when name exists', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const api: UpdateDescription = new UpdateDescription(dbClient)
    
    await expect(
        api.execute({
            name: TestConstants.NAME,
            description: TestConstants.DESCRIPTION_2
        })
    ).resolves.toEqual(`Successfully updated description of '${TestConstants.NAME}'`)
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME_CHANGE_DESCRIPTION)
})

test('will throw excpetion when name is invalid', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const api: UpdateDescription = new UpdateDescription(dbClient)
    
    await expect(
        api.execute({
            name: TestConstants.BAD_REQUEST,
            description: TestConstants.DESCRIPTION_2
        })
    ).rejects.toThrow("Cannot set properties of undefined (setting 'description')")
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME)
})

test('will fail to update description when item name not passed in', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const api: UpdateDescription = new UpdateDescription(dbClient)

    await expect(
        api.execute({
            description: TestConstants.DESCRIPTION_2
        })
    ).rejects.toThrow("Missing required field 'name'")
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME)
})

test('will fail to update description when item description not passed in', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const api: UpdateDescription = new UpdateDescription(dbClient)

    await expect(
        api.execute({
            name: TestConstants.NAME,
        })
    ).rejects.toThrow("Missing required field 'description'")
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME)
})