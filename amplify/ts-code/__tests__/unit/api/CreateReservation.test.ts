import { CreateReservation } from "../../../src/api/CreateReservation"
import { DBSeed, TestConstants, TestTimestamps } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"

test('will create reservation correctly when items exist and are available', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH)
    const api: CreateReservation = new CreateReservation(dbClient)

    // Mock ID
    CreateReservation.prototype.getUniqueId = jest.fn(() => Promise.resolve(TestConstants.RESERVATION_ID));

    await expect(
        api.execute({
            borrower: TestConstants.BORROWER,
            ids: [TestConstants.ITEM_ID, TestConstants.ITEM_ID_2],
            startTime: TestConstants.START_DATE,
            endTime: TestConstants.END_DATE,
            notes: TestConstants.NOTES
        })
    ).resolves.toEqual(TestConstants.RESERVATION_ID)
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
})

test('will fail to create reservation when items already reserved', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const api: CreateReservation = new CreateReservation(dbClient)

    // Mock ID
    CreateReservation.prototype.getUniqueId = jest.fn(() => Promise.resolve(TestConstants.RESERVATION_ID_2));

    await expect(
        api.execute({
            borrower: TestConstants.BORROWER_2,
            ids: [TestConstants.ITEM_ID, TestConstants.ITEM_ID_2],
            startTime: TestConstants.START_DATE,
            endTime: TestConstants.END_DATE,
            notes: TestConstants.NOTES
        })
    ).rejects.toThrow(`Item ${TestConstants.ITEM_ID} is reserved starting ${TestConstants.START_DATE} and ending ${TestConstants.END_DATE}`)
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
})

test('will fail to create reservation when itemId is invalid', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH)
    const api: CreateReservation = new CreateReservation(dbClient)

    // Mock ID
    CreateReservation.prototype.getUniqueId = jest.fn(() => Promise.resolve(TestConstants.RESERVATION_ID));

    await expect(
        api.execute({
            borrower: TestConstants.BORROWER,
            ids: [TestConstants.ITEM_ID, TestConstants.BAD_REQUEST],
            startTime: TestConstants.START_DATE,
            endTime: TestConstants.END_DATE,
            notes: TestConstants.NOTES
        })
    ).rejects.toThrow(`Unable to find itemId ${TestConstants.BAD_REQUEST}`)
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH)
})

test('will fail to create reservation when borrower not passed in', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH)
    const api: CreateReservation = new CreateReservation(dbClient)

    // Mock ID
    CreateReservation.prototype.getUniqueId = jest.fn(() => Promise.resolve(TestConstants.RESERVATION_ID));

    await expect(
        api.execute({
            ids: [TestConstants.ITEM_ID, TestConstants.ITEM_ID_2],
            startTime: TestConstants.START_DATE,
            endTime: TestConstants.END_DATE,
            notes: TestConstants.NOTES
        })
    ).rejects.toThrow("Missing required field 'borrower'")
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH)
})

test('will fail to create reservation when startTime not passed in', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH)
    const api: CreateReservation = new CreateReservation(dbClient)
    
    // Mock ID
    CreateReservation.prototype.getUniqueId = jest.fn(() => Promise.resolve(TestConstants.RESERVATION_ID));

    await expect(
        api.execute({
            borrower: TestConstants.BORROWER,
            ids: [TestConstants.ITEM_ID, TestConstants.ITEM_ID_2],
            endTime: TestConstants.END_DATE,
            notes: TestConstants.NOTES
        })
    ).rejects.toThrow("Missing required field 'startTime'")
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH)
})

test('will fail to create reservation when endTime not passed in', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH)
    const api: CreateReservation = new CreateReservation(dbClient)
    
    // Mock ID
    CreateReservation.prototype.getUniqueId = jest.fn(() => Promise.resolve(TestConstants.RESERVATION_ID));

    await expect(
        api.execute({
            borrower: TestConstants.BORROWER,
            ids: [TestConstants.ITEM_ID, TestConstants.ITEM_ID_2],
            startTime: TestConstants.START_DATE,
            notes: TestConstants.NOTES
        })
    ).rejects.toThrow("Missing required field 'endTime'")
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH)
})

test('will fail to create reservation when item ids are not passed in', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH)
    const api: CreateReservation = new CreateReservation(dbClient)

    // Mock ID
    CreateReservation.prototype.getUniqueId = jest.fn(() => Promise.resolve(TestConstants.RESERVATION_ID));

    await expect(
        api.execute({
            borrower: TestConstants.BORROWER,
            startTime: TestConstants.START_DATE,
            endTime: TestConstants.END_DATE,
            notes: TestConstants.NOTES
        })
    ).rejects.toThrow("Missing required field 'ids'")
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH)
})

test('will fail to create reservation when duplicate item ids are passed in', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH)
    const api: CreateReservation = new CreateReservation(dbClient)

    // Mock ID
    CreateReservation.prototype.getUniqueId = jest.fn(() => Promise.resolve(TestConstants.RESERVATION_ID));

    await expect(
        api.execute({
            borrower: TestConstants.BORROWER,
            ids: [TestConstants.ITEM_ID, TestConstants.ITEM_ID],
            startTime: TestConstants.START_DATE,
            endTime: TestConstants.END_DATE,
            notes: TestConstants.NOTES
        })
    ).rejects.toThrow("Duplicate itemIds were passed")
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH)
})

test('will fail to create reservation when startTime is in the range of another reservation', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const api: CreateReservation = new CreateReservation(dbClient)

    // Mock ID
    CreateReservation.prototype.getUniqueId = jest.fn(() => Promise.resolve(TestConstants.RESERVATION_ID_2));

    await expect(
        api.execute({
            borrower: TestConstants.BORROWER_2,
            ids: [TestConstants.ITEM_ID, TestConstants.ITEM_ID_2],
            startTime: TestConstants.START_DATE_2,
            endTime: TestConstants.END_DATE,
            notes: TestConstants.NOTES
        })
    ).rejects.toThrow(`Item ${TestConstants.ITEM_ID} is reserved starting ${TestConstants.START_DATE} and ending ${TestConstants.END_DATE}`)
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
})

test('will fail to create reservation when endTime is in the range of another reservation', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const api: CreateReservation = new CreateReservation(dbClient)

    // Mock ID
    CreateReservation.prototype.getUniqueId = jest.fn(() => Promise.resolve(TestConstants.RESERVATION_ID_2));

    await expect(
        api.execute({
            borrower: TestConstants.BORROWER_2,
            ids: [TestConstants.ITEM_ID, TestConstants.ITEM_ID_2],
            startTime: TestConstants.START_DATE_3,
            endTime: TestConstants.END_DATE_2,
            notes: TestConstants.NOTES
            })
    ).rejects.toThrow(`Item ${TestConstants.ITEM_ID} is reserved starting ${TestConstants.START_DATE} and ending ${TestConstants.END_DATE}`)
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
})

test('will fail to create reservation when startTime format is wrong', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH)
    const api: CreateReservation = new CreateReservation(dbClient)

    // Mock ID
    CreateReservation.prototype.getUniqueId = jest.fn(() => Promise.resolve(TestConstants.RESERVATION_ID_2));

    await expect(
        api.execute({
            borrower: TestConstants.BORROWER_2,
            ids: [TestConstants.ITEM_ID, TestConstants.ITEM_ID_2],
            startTime: TestConstants.BAD_REQUEST,
            endTime: TestConstants.END_DATE,
            notes: TestConstants.NOTES
            })
    ).rejects.toThrow(`Date format incorrect for 'startTime' ${TestConstants.BAD_REQUEST}`)
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH)
})

test('will fail to create reservation when endTime format is wrong', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH)
    const api: CreateReservation = new CreateReservation(dbClient)

    // Mock ID
    CreateReservation.prototype.getUniqueId = jest.fn(() => Promise.resolve(TestConstants.RESERVATION_ID_2));

    await expect(
        api.execute({
            borrower: TestConstants.BORROWER_2,
            ids: [TestConstants.ITEM_ID, TestConstants.ITEM_ID_2],
            startTime: TestConstants.START_DATE,
            endTime: TestConstants.BAD_REQUEST,
            notes: TestConstants.NOTES
            })
    ).rejects.toThrow(`Date format incorrect for 'endTime' ${TestConstants.BAD_REQUEST}`)
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH)
})

