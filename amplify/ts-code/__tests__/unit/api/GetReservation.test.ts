import { GetReservation } from "../../../src/api/GetReservation"
import { ScheduleSchema } from "../../../src/db/Schemas"
import { DBSeed, TestConstants} from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"

test('will get reservation correctly when id is passed in', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const api: GetReservation = new GetReservation(dbClient)

    const expectedReservation: ScheduleSchema = {
        id: TestConstants.RESERVATION_ID,
        borrower: TestConstants.BORROWER,
        itemIds: [TestConstants.ITEM_ID, TestConstants.ITEM_ID_2],
        startTime: TestConstants.START_DATE,
        endTime: TestConstants.END_DATE,
        notes: TestConstants.NOTES
    }

    await expect(
        api.execute({
            id: TestConstants.RESERVATION_ID,
        })
    ).resolves.toEqual(expectedReservation)
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
})

test('will fail to get reservation when id is not passed in', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const api: GetReservation = new GetReservation(dbClient)

    await expect(
        api.execute({
        })
    ).rejects.toThrow("Missing required field 'id'")
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
})

test('will fail to get reservation when id is invalid', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const api: GetReservation = new GetReservation(dbClient)

    await expect(
        api.execute({
            id: TestConstants.BAD_REQUEST
        })
    ).rejects.toThrow(`Reservation not found. id: '${TestConstants.BAD_REQUEST}' is invalid`)
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
})