import getClients from "../../../../src/handlers/api/APIHelper"
import { handler } from "../../../../src/handlers/api/DeleteItem"
import { DBSeed, TestConstants} from "../../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../../__dev__/db/LocalDBClient"
import { LocalMetricsClient } from "../../../../__dev__/metrics/LocalMetricsClient"

test('will delete item correctly when using handler', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES)
    const metricsClient: LocalMetricsClient = new LocalMetricsClient()

    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)

    await expect(
        handler({
            body: JSON.stringify({
            id: TestConstants.ITEM_ID_2
        })
        } as any, null, null)
    ).resolves.toEqual({ statusCode: 200, body: JSON.stringify(`Deleted a '${TestConstants.NAME_2}' from the inventory.`) })
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME)
    metricsClient.assureState(0)
})