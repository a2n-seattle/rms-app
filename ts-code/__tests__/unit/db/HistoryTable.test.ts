import { HistoryTable } from "../../../src/db/HistoryTable"
import { DBSeed } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"

test('will get a history entry by id', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME_BORROWED)
    const table: HistoryTable = new HistoryTable(dbClient)

    await expect(table.get("1000000000000-123")).resolves.toEqual(dbClient.getDB().history["1000000000000-123"])
})

test('will resolve undefined for a history id that does not exist', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const table: HistoryTable = new HistoryTable(dbClient)

    await expect(table.get("does-not-exist")).resolves.toBeUndefined()
})
