import { GetBorrowGroup } from "../../../src/api/GetBorrowGroup"
import { DBSeed, TestConstants } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"
import { ItemsSchema } from "../../../src/db/Schemas"

function seedBorrowGroupSchedule(dbClient: LocalDBClient): void {
    // GetBorrowGroup now looks the group up via ScheduleTable.get(borrowGroupId) (the schedule
    // row consumed to create the borrow, kept alive by ScheduleTable.consume() -- see GH-389)
    // rather than scanning ItemsTable, so a real schedule row must exist for the lookup to
    // find anything.
    dbClient.getDB().schedule[TestConstants.RESERVATION_ID] = {
        id: TestConstants.RESERVATION_ID,
        borrower: TestConstants.BORROWER,
        itemIds: [TestConstants.ITEM_ID, TestConstants.ITEM_ID_2],
        startTime: 0,
        endTime: 1,
        notes: ""
    }
}

test('will list every item sharing a borrowGroupId', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_BORROWED)
    seedBorrowGroupSchedule(dbClient)
    dbClient.getDB().items[TestConstants.ITEM_ID].borrowGroupId = TestConstants.RESERVATION_ID
    dbClient.getDB().items[TestConstants.ITEM_ID_2].borrowGroupId = TestConstants.RESERVATION_ID
    const api: GetBorrowGroup = new GetBorrowGroup(dbClient)

    const result = await api.execute({ borrowGroupId: TestConstants.RESERVATION_ID })

    expect(result.items.map((item: ItemsSchema) => item.id).sort()).toEqual(
        [TestConstants.ITEM_ID, TestConstants.ITEM_ID_2].sort()
    )
})

test('will exclude an item that has since been individually returned (partial return, GH-389)', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_BORROWED)
    seedBorrowGroupSchedule(dbClient)
    // ITEM_ID is still part of the group; ITEM_ID_2 was already returned individually, which
    // clears its borrowGroupId (ItemTable.changeBorrower's "return" action) even though it's
    // still listed in the schedule's itemIds.
    dbClient.getDB().items[TestConstants.ITEM_ID].borrowGroupId = TestConstants.RESERVATION_ID

    const api: GetBorrowGroup = new GetBorrowGroup(dbClient)

    await expect(api.execute({ borrowGroupId: TestConstants.RESERVATION_ID })).resolves.toEqual({
        items: [dbClient.getDB().items[TestConstants.ITEM_ID]]
    })
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
