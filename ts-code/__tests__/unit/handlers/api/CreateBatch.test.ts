import getClients from "../../../../src/handlers/api/APIHelper"
import { handler } from "../../../../src/handlers/api/CreateBatch"
import { DBSeed, TestConstants} from "../../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../../__dev__/db/LocalDBClient"
import { LocalMetricsClient } from "../../../../__dev__/metrics/LocalMetricsClient"

test('will create batch correctly when using handler', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES)
    const metricsClient: LocalMetricsClient = new LocalMetricsClient()

    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)

    await expect(
        handler({
            name: TestConstants.BATCH,
            ids: [ TestConstants.ITEM_ID, TestConstants.ITEM_ID_2 ],
            groups: [ TestConstants.GROUP ]
        }, null, null)
    ).resolves.toEqual(`Successfully created batch '${TestConstants.BATCH}'`)
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH)
    metricsClient.assureState(0)
})