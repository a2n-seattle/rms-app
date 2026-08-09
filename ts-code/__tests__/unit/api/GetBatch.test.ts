import { GetBatch } from "../../../src/api/GetBatch"
import { DBSeed, TestConstants } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"
import { LocalUserDirectoryClient } from "../../../__dev__/cognito/LocalUserDirectoryClient"

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

test('will get batch details enriched with name/owner/borrower when batch exists', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_TWO_BATCH)
    const api: GetBatch = new GetBatch(dbClient)

    await expect(
        api.executeDetailed({
            name: TestConstants.BATCH
        })
    ).resolves.toEqual([
        { id: TestConstants.ITEM_ID, name: TestConstants.DISPLAYNAME, owner: TestConstants.OWNER, borrower: "" },
        { id: TestConstants.ITEM_ID_2, name: "test name 2", owner: TestConstants.OWNER_2, borrower: "" }
    ])
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_TWO_BATCH)
})

test('will fail executeDetailed when batch is not found', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_TWO_BATCH)
    const api: GetBatch = new GetBatch(dbClient)

    await expect(
        api.executeDetailed({
            name: TestConstants.BAD_REQUEST
        })
    ).rejects.toThrow(`Unable to find Batch '${TestConstants.BAD_REQUEST}'`)
})

test('will resolve owner/borrower display names when a UserDirectoryClient is injected (GH-358)', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_TWO_BATCH)
    dbClient.getDB().main["00000000-0000-0000-0000-000000000001"].ownerId = TestConstants.BORROWER
    dbClient.getDB().items[TestConstants.ITEM_ID].borrower = TestConstants.BORROWER
    const userDirectory = new LocalUserDirectoryClient([
        { sub: TestConstants.BORROWER, email: "borrower@example.com", name: "Test Borrower" }
    ])
    const api: GetBatch = new GetBatch(dbClient, undefined, userDirectory)

    await expect(
        api.executeDetailed({
            name: TestConstants.BATCH
        })
    ).resolves.toEqual([
        {
            id: TestConstants.ITEM_ID,
            name: TestConstants.DISPLAYNAME,
            owner: TestConstants.OWNER,
            borrower: TestConstants.BORROWER,
            ownerDisplayName: "Test Borrower",
            borrowerDisplayName: "Test Borrower"
        },
        {
            id: TestConstants.ITEM_ID_2,
            name: "test name 2",
            owner: TestConstants.OWNER_2,
            borrower: "",
            ownerDisplayName: undefined,
            borrowerDisplayName: undefined
        }
    ])
})

test('will fall back to email when a resolved Cognito user has no name attribute (GH-358)', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_TWO_BATCH)
    dbClient.getDB().items[TestConstants.ITEM_ID].borrower = TestConstants.BORROWER
    const userDirectory = new LocalUserDirectoryClient([
        { sub: TestConstants.BORROWER, email: "borrower@example.com" }
    ])
    const api: GetBatch = new GetBatch(dbClient, undefined, userDirectory)

    const result = await api.executeDetailed({ name: TestConstants.BATCH })

    expect(result[0].borrowerDisplayName).toEqual("borrower@example.com")
})