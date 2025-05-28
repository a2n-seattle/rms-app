import { GetItemHistory } from "../../../src/api/GetItemHistory"
import { DBSeed, TestConstants, TestHistory } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"

test('will get item history correctly when item with item id exists', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME_BORROWED)
    const api: GetItemHistory = new GetItemHistory(dbClient)
    
    
    await expect(
        api.execute({
            itemId: TestConstants.ITEM_ID
        })
    ).resolves.toEqual(TestHistory)
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME_BORROWED)
})

test('will fail when there are no items with item id', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const api: GetItemHistory = new GetItemHistory(dbClient)
    
    
    await expect(
        api.execute({
            itemId: TestConstants.ITEM_ID
        })
    ).rejects.toThrow(`Item not found. id: '${TestConstants.ITEM_ID}' is invalid`)
    expect(dbClient.getDB()).toEqual(DBSeed.EMPTY)
})