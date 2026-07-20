import { PrintTable } from "../../../../src/api/internal/PrintTable"
import { MAIN_TABLE } from "../../../../src/db/Schemas"
import { DBSeed, TestConstants } from "../../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../../__dev__/db/LocalDBClient"

test('will print item correctly when main table is empty', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const api: PrintTable = new PrintTable(dbClient)
    
    await expect(
        api.execute({
            tableName: MAIN_TABLE
        })
    ).resolves.toEqual({
        "$metadata": {},
        Items: [],
        Count: 0,
        ScannedCount: 0
    })
    expect(dbClient.getDB()).toEqual(DBSeed.EMPTY)
})

test('will fail to print item when table name is invalid', () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const api: PrintTable = new PrintTable(dbClient)
    
    // Throws exceiption outside of a promise
    expect(() =>
        api.execute({
            tableName: TestConstants.BAD_REQUEST
        })
    ).toThrow("Unsupported Table Name: " + TestConstants.BAD_REQUEST)
    expect(dbClient.getDB()).toEqual(DBSeed.EMPTY)
})