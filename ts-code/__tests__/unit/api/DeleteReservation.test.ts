import { DeleteReservation } from "../../../src/api/DeleteReservation"
import { DBSeed, TestConstants} from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"

test('will delete reservation correctly when reservation exist', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const api: DeleteReservation = new DeleteReservation(dbClient)

    await expect(
        api.execute({
            id: TestConstants.RESERVATION_ID
        })
    ).resolves.toEqual(`Successfully deleted reservation '${TestConstants.RESERVATION_ID}'.`)
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH)
})

test('will fail to delete reservation when id is invalid', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const api: DeleteReservation = new DeleteReservation(dbClient)

    await expect(
        api.execute({
            id: TestConstants.BAD_REQUEST
        })
    ).rejects.toThrow(`Schedule ${TestConstants.BAD_REQUEST} doesn't exist.`)
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
})

test('will fail to delete reservation when id is not passed in', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const api: DeleteReservation = new DeleteReservation(dbClient)

    await expect(
        api.execute({
        })
    ).rejects.toThrow("Missing required field 'id'")
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
})
