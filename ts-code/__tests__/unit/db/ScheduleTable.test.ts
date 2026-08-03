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
