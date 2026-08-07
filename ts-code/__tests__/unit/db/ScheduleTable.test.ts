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

test('will return reservations in order across a paginated cursor, driven by UserTable.reserved', async () => {
    const seed: any = {
        main: {}, items: {}, batch: {}, tags: {}, history: {},
        schedule: {
            "a": { id: "a", borrower: TestConstants.BORROWER, itemIds: [], startTime: 0, endTime: 1 },
            "b": { id: "b", borrower: TestConstants.BORROWER, itemIds: [], startTime: 0, endTime: 1 }
        },
        transactions: {},
        user: { [TestConstants.BORROWER]: { id: TestConstants.BORROWER, owned: [], reserved: ["a", "b"], borrowed: [], history: [] } }
    }
    const dbClient: LocalDBClient = new LocalDBClient(seed)
    const table: ScheduleTable = new ScheduleTable(dbClient)

    const page1 = await table.listByBorrower(TestConstants.BORROWER, 1)
    expect(page1.items).toEqual([seed.schedule["a"]])
    expect(page1.nextPageToken).toBeDefined()

    await expect(table.listByBorrower(TestConstants.BORROWER, 1, page1.nextPageToken)).resolves.toEqual({
        items: [seed.schedule["b"]],
        nextPageToken: undefined
    })
})

test('listByBorrower applies an optional predicate while still looping until `limit` real matches', async () => {
    const seed: any = {
        main: {}, items: {}, batch: {}, tags: {}, history: {},
        schedule: {
            "a-excluded": { id: "a-excluded", borrower: TestConstants.BORROWER, itemIds: [], startTime: 0, endTime: 1 },
            "z-included": { id: "z-included", borrower: TestConstants.BORROWER, itemIds: [], startTime: 0, endTime: 1 }
        },
        transactions: {},
        user: { [TestConstants.BORROWER]: { id: TestConstants.BORROWER, owned: [], reserved: ["a-excluded", "z-included"], borrowed: [], history: [] } }
    }
    const dbClient: LocalDBClient = new LocalDBClient(seed)
    const table: ScheduleTable = new ScheduleTable(dbClient)

    await expect(
        table.listByBorrower(TestConstants.BORROWER, 1, undefined, (schedule) => schedule.id === "z-included")
    ).resolves.toEqual({
        items: [seed.schedule["z-included"]],
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

test('will reject create() when the new range fully contains an existing reservation', async () => {
    // TWO_NAMES_ONE_BATCH_RESERVED already has a reservation on ITEM_ID
    // running START_DATE..END_DATE. A new range starting well before and
    // ending well after that window doesn't have either of its own
    // endpoints inside the old range, so this only fails if the added
    // containment clause in validateDate is present.
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const table: ScheduleTable = new ScheduleTable(dbClient)

    await expect(
        table.create(
            "new-id",
            TestConstants.BORROWER_2,
            [TestConstants.ITEM_ID],
            TestTimestamps.START_DATE - 100000,
            TestTimestamps.END_DATE + 100000,
            TestConstants.NOTES_2
        )
    ).rejects.toThrow(`Item ${TestConstants.ITEM_ID} is reserved starting ${TestTimestamps.START_DATE} and ending ${TestTimestamps.END_DATE}`)
})

test('updateEndTime will extend a reservation in place, preserving its id', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const table: ScheduleTable = new ScheduleTable(dbClient)

    const newEndTime = TestTimestamps.END_DATE + 100000
    await expect(table.updateEndTime(TestConstants.RESERVATION_ID, newEndTime)).resolves.toEqual(TestConstants.RESERVATION_ID)

    await expect(table.get(TestConstants.RESERVATION_ID)).resolves.toMatchObject({
        id: TestConstants.RESERVATION_ID,
        startTime: TestTimestamps.START_DATE,
        endTime: newEndTime
    })
})

test('updateEndTime will not conflict with its own pre-extension window', async () => {
    // Extending RESERVED_SCHEDULE's own endTime shouldn't trip the overlap
    // check against itself -- its own (pre-extension) window is still
    // present in each item's schedule[] list at validation time and must
    // be excluded.
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const table: ScheduleTable = new ScheduleTable(dbClient)

    await expect(
        table.updateEndTime(TestConstants.RESERVATION_ID, TestTimestamps.END_DATE + 1000)
    ).resolves.toEqual(TestConstants.RESERVATION_ID)
})

test('updateEndTime will reject a new end time that conflicts with a different reservation', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const table: ScheduleTable = new ScheduleTable(dbClient)

    await table.create(
        "other-schedule",
        TestConstants.BORROWER_2,
        [TestConstants.ITEM_ID],
        TestTimestamps.END_DATE + 100000,
        TestTimestamps.END_DATE + 200000,
        TestConstants.NOTES_2
    )

    await expect(
        table.updateEndTime(TestConstants.RESERVATION_ID, TestTimestamps.END_DATE + 150000)
    ).rejects.toThrow(`Item ${TestConstants.ITEM_ID} is reserved starting ${TestTimestamps.END_DATE + 100000} and ending ${TestTimestamps.END_DATE + 200000}`)
})

test('updateEndTime will reject a new end time before the reservation start time', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const table: ScheduleTable = new ScheduleTable(dbClient)

    await expect(
        table.updateEndTime(TestConstants.RESERVATION_ID, TestTimestamps.START_DATE - 1000)
    ).rejects.toThrow(
        `New end time ${TestTimestamps.START_DATE - 1000} must be after the reservation's start time ${TestTimestamps.START_DATE}`
    )
})

test('updateEndTime will fail when the reservation does not exist', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const table: ScheduleTable = new ScheduleTable(dbClient)

    await expect(table.updateEndTime(TestConstants.RESERVATION_ID, TestTimestamps.END_DATE)).rejects.toThrow(
        `Schedule ${TestConstants.RESERVATION_ID} doesn't exist.`
    )
})

test('updateEndTime ignores a stale schedule id left on an item after its Schedule row was deleted out-of-band', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    // A second, unrelated stale reference on the same item, alongside the
    // reservation actually being extended.
    dbClient.getDB().items[TestConstants.ITEM_ID].schedule.push("stale-id")

    const table: ScheduleTable = new ScheduleTable(dbClient)

    await expect(
        table.updateEndTime(TestConstants.RESERVATION_ID, TestTimestamps.END_DATE + 1000)
    ).resolves.toEqual(TestConstants.RESERVATION_ID)
})
