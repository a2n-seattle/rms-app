import getClients from "../../../../src/handlers/api/APIHelper"
import { handler } from "../../../../src/handlers/api/UpdateTags"
import { DBSeed, TestConstants} from "../../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../../__dev__/db/LocalDBClient"
import { LocalMetricsClient } from "../../../../__dev__/metrics/LocalMetricsClient"

test('will update tags correctly when using handler', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const metricsClient: LocalMetricsClient = new LocalMetricsClient()

    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)

    await expect(
        handler({
            body: JSON.stringify({
            name: TestConstants.NAME,
            tags: [ TestConstants.TAG_2 ]
        })
        } as any, null, null)
    ).resolves.toEqual({ statusCode: 200, body: JSON.stringify(`Successfully updated tags for '${TestConstants.NAME}'`) })
    expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME_CHANGE_TAGS)
    metricsClient.assureState(0)
})