import { DBSeed, TestConstants, TestTimestamps } from "../../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../../__dev__/db/LocalDBClient"
import { LocalMetricsClient } from "../../../../__dev__/metrics/LocalMetricsClient"
import getClients from "../../../../src/handlers/api/APIHelper"
import { handler } from "../../../../src/handlers/api/BorrowFromSchedule"

test('will borrow item correctly with handler when schedule id exists', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const metricsClient: LocalMetricsClient = new LocalMetricsClient()

    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)
    
    // Mock Date
    Date.now = jest.fn(() => TestTimestamps.BORROW_BATCH)

    let scheduleId: string = TestConstants.RESERVATION_ID

    await expect(
        handler({
            body: JSON.stringify({
            scheduleId: scheduleId, 
            notes: TestConstants.NOTES
        })
        } as any, null, null)
    ).resolves.toEqual({ statusCode: 200, body: JSON.stringify(`Successfully borrowed items from schedule '${scheduleId}'.`) })

    // Every item borrowed from this schedule now also records the
    // schedule's own id as borrowGroupId (see ItemTable.changeBorrower) --
    // assert per-field with toMatchObject rather than a whole-DB toEqual
    // against the raw seed constant, since that constant predates this
    // field.
    const db = dbClient.getDB()
    expect(db.items[TestConstants.ITEM_ID]).toMatchObject({ borrowGroupId: scheduleId })
    expect(db.items[TestConstants.ITEM_ID_2]).toMatchObject({ borrowGroupId: scheduleId })
    expect(db.schedule).toEqual({})
    metricsClient.assureState(0)
})