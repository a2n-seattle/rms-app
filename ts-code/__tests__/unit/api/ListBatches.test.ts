import { ListBatches } from "../../../src/api/ListBatches"
import { DBSeed, TestConstants } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"
import { BatchSchema } from "../../../src/db/Schemas"

const TEST_BATCH: BatchSchema = {
    id: TestConstants.BATCH,
    val: ["123", "12345"],
    groups: [TestConstants.GROUP]
}

test('will list batches when they exist', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH)
    const api: ListBatches = new ListBatches(dbClient)

    await expect(api.execute({})).resolves.toEqual({
        items: [TEST_BATCH],
        nextPageToken: undefined
    })
})

test('will return no items when no batches exist', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const api: ListBatches = new ListBatches(dbClient)

    await expect(api.execute({})).resolves.toEqual({
        items: [],
        nextPageToken: undefined
    })
})
