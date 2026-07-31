import getClients from "../../../../src/handlers/api/APIHelper"
import { apiHelper } from "../../../../src/handlers/api/APIHelper"

test('will reject when executable rejects, instead of resolving with the error', async () => {
    const error = new Error("something went wrong")

    await expect(
        apiHelper(() => Promise.reject(error))
    ).rejects.toEqual(error)
})

test('will pass through the DB and metrics clients from getClients', async () => {
    const dbClient = {} as any
    const metricsClient = {} as any
    getClients.getDBClient = jest.fn(() => dbClient)
    getClients.getMetricsClient = jest.fn(() => metricsClient)

    await expect(
        apiHelper((db, metrics) => Promise.resolve(db === dbClient && metrics === metricsClient))
    ).resolves.toEqual(true)
})
