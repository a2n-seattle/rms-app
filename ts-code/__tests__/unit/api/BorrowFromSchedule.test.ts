import { BorrowFromSchedule } from "../../../src/api/BorrowFromSchedule"
import { DBSeed, TestConstants, TestTimestamps } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"


test('will borrow item correctly when schedule id exists', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const api: BorrowFromSchedule = new BorrowFromSchedule(dbClient)
    
    // Mock Date
    Date.now = jest.fn(() => TestTimestamps.BORROW_BATCH)

    let scheduleId: string = TestConstants.RESERVATION_ID

    await expect(
        api.execute({
            scheduleId: scheduleId,
            notes: TestConstants.NOTES
        })
    ).resolves.toEqual(`Successfully borrowed items from schedule '${scheduleId}'.`)

    // Every item borrowed from this schedule now also records the
    // schedule's own id as borrowGroupId (see ItemTable.changeBorrower) --
    // assert per-field with toMatchObject rather than a whole-DB toEqual
    // against the raw seed constant, since that constant predates this
    // field.
    const db = dbClient.getDB()
    expect(db.items[TestConstants.ITEM_ID]).toMatchObject({ borrowGroupId: scheduleId })
    expect(db.items[TestConstants.ITEM_ID_2]).toMatchObject({ borrowGroupId: scheduleId })
    expect(db.schedule).toEqual({})
})


test('will fail when schedule id does not exist', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const api: BorrowFromSchedule = new BorrowFromSchedule(dbClient)
    
    // Mock Date
    Date.now = jest.fn(() => TestTimestamps.BORROW_BATCH)

    let scheduleId: string = TestConstants.RESERVATION_ID

    await expect(
        api.execute({
            scheduleId: scheduleId,
            notes: TestConstants.NOTES
        })
    ).rejects.toThrow(`Reservation not found. id: '${scheduleId}' is invalid`)
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME)
})