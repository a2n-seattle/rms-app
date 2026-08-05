import { GetBorrowGroup } from "../../../src/api/GetBorrowGroup"
import { DBSeed, TestConstants } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"
import { ItemsSchema } from "../../../src/db/Schemas"

test('will list every item sharing a borrowGroupId', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_BORROWED)
    dbClient.getDB().items[TestConstants.ITEM_ID].borrowGroupId = TestConstants.RESERVATION_ID
    dbClient.getDB().items[TestConstants.ITEM_ID_2].borrowGroupId = TestConstants.RESERVATION_ID
    const api: GetBorrowGroup = new GetBorrowGroup(dbClient)

    const result = await api.execute({ borrowGroupId: TestConstants.RESERVATION_ID })

    expect(result.items.map((item: ItemsSchema) => item.id).sort()).toEqual(
        [TestConstants.ITEM_ID, TestConstants.ITEM_ID_2].sort()
    )
})

test('will return no items when nothing shares the given borrowGroupId', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_BORROWED)
    const api: GetBorrowGroup = new GetBorrowGroup(dbClient)

    await expect(api.execute({ borrowGroupId: TestConstants.RESERVATION_ID })).resolves.toEqual({ items: [] })
})

test('will fail when borrowGroupId is missing', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const api: GetBorrowGroup = new GetBorrowGroup(dbClient)

    await expect(api.execute({})).rejects.toThrow("Missing required field 'borrowGroupId'")
})
