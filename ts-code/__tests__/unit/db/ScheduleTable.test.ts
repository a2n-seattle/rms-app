import { ScheduleTable } from "../../../src/db/ScheduleTable"
import { DBSeed, TestConstants, TestTimestamps } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"
import { ScheduleSchema } from "../../../src/db/Schemas"

const RESERVED_SCHEDULE: ScheduleSchema = {
    id: TestConstants.RESERVATION_ID,
    borrower: TestConstants.BORROWER,
    itemIds: [TestConstants.ITEM_ID, TestConstants.ITEM_ID_2],
    startTime: TestTimestamps.START_DATE,
    endTime: TestTimestamps.END_DATE,
    notes: TestConstants.NOTES
}

test('will list reservations for a borrower when they exist', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const table: ScheduleTable = new ScheduleTable(dbClient)

    await expect(table.listByBorrower(TestConstants.BORROWER)).resolves.toEqual({
        items: [RESERVED_SCHEDULE],
        nextPageToken: undefined
    })
})

test('will return no reservations when borrower has none', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const table: ScheduleTable = new ScheduleTable(dbClient)

    await expect(table.listByBorrower(TestConstants.BORROWER_2)).resolves.toEqual({
        items: [],
        nextPageToken: undefined
    })
})

test('create() ignores a stale schedule id left on an item after its Schedule row was deleted out-of-band', async () => {
    // Simulates deleting a row directly from the Schedule table without
    // going through ScheduleTable.delete's cleanup of the item's
    // back-reference (e.g. a manual DynamoDB console/CLI delete) --
    // item.schedule[] still lists an id with no corresponding row. The
    // overlap check in create() must skip it rather than crash
    // dereferencing undefined.startTime.
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    delete dbClient.getDB().schedule[TestConstants.RESERVATION_ID]

    const table: ScheduleTable = new ScheduleTable(dbClient)

    await expect(
        table.create(
            "new-id",
            TestConstants.BORROWER_2,
            [TestConstants.ITEM_ID],
            TestTimestamps.START_DATE,
            TestTimestamps.END_DATE,
            TestConstants.NOTES_2
        )
    ).resolves.toEqual("new-id")
})
