import { ListUpcomingReservations } from "../../../src/api/ListUpcomingReservations"
import { DBSeed, TestConstants } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"
import { ScheduleSchema } from "../../../src/db/Schemas"

test('will exclude reservations whose startTime has already passed', async () => {
    // TWO_NAMES_ONE_BATCH_RESERVED's one reservation starts in 2022 --
    // already in the past relative to any real test run.
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const api: ListUpcomingReservations = new ListUpcomingReservations(dbClient)

    await expect(api.execute({ borrower: TestConstants.BORROWER })).resolves.toEqual({
        items: [],
        nextPageToken: undefined
    })
})

test('will include reservations whose startTime is in the future', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const futureStart: number = Date.now() + 1000 * 60 * 60 * 24
    const futureEnd: number = futureStart + 1000 * 60 * 60

    const futureSchedule: ScheduleSchema = {
        id: TestConstants.RESERVATION_ID_2,
        borrower: TestConstants.BORROWER,
        itemIds: [TestConstants.ITEM_ID],
        startTime: futureStart,
        endTime: futureEnd,
        notes: TestConstants.NOTES_2
    }
    dbClient.getDB().schedule[TestConstants.RESERVATION_ID_2] = futureSchedule

    const api: ListUpcomingReservations = new ListUpcomingReservations(dbClient)

    await expect(api.execute({ borrower: TestConstants.BORROWER })).resolves.toEqual({
        items: [futureSchedule],
        nextPageToken: undefined
    })
})

test('will fail when borrower is missing', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const api: ListUpcomingReservations = new ListUpcomingReservations(dbClient)

    await expect(api.execute({})).rejects.toThrow("Missing required field 'borrower'")
})
