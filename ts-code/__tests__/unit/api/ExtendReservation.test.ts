import { ExtendReservation } from "../../../src/api/ExtendReservation"
import { DBSeed, TestConstants, TestTimestamps } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"

test('will extend a reservation correctly', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const api: ExtendReservation = new ExtendReservation(dbClient)

    const newEndTime = TestTimestamps.END_DATE + 100000

    await expect(
        api.execute({ id: TestConstants.RESERVATION_ID, newEndTime })
    ).resolves.toEqual(TestConstants.RESERVATION_ID)

    await expect(dbClient.getDB().schedule[TestConstants.RESERVATION_ID]).toMatchObject({
        endTime: newEndTime
    })
})

test('will fail when id is missing', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const api: ExtendReservation = new ExtendReservation(dbClient)

    await expect(
        api.execute({ newEndTime: TestTimestamps.END_DATE + 100000 })
    ).rejects.toThrow("Missing required field 'id'")
})

test('will fail when newEndTime is missing', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const api: ExtendReservation = new ExtendReservation(dbClient)

    await expect(
        api.execute({ id: TestConstants.RESERVATION_ID })
    ).rejects.toThrow("Missing required field 'newEndTime'")
})

test('will fail when newEndTime is not a valid date', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const api: ExtendReservation = new ExtendReservation(dbClient)

    await expect(
        api.execute({ id: TestConstants.RESERVATION_ID, newEndTime: TestTimestamps.BAD_REQUEST })
    ).rejects.toThrow(`Date format incorrect for 'newEndTime' ${TestTimestamps.BAD_REQUEST}`)
})

test('will fail when the reservation does not exist', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const api: ExtendReservation = new ExtendReservation(dbClient)

    await expect(
        api.execute({ id: TestConstants.RESERVATION_ID, newEndTime: TestTimestamps.END_DATE })
    ).rejects.toThrow(`Schedule ${TestConstants.RESERVATION_ID} doesn't exist.`)
})
