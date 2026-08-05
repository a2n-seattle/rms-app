import { ListMyOwnedItems } from "../../../src/api/ListMyOwnedItems"
import { DBSeed, TestConstants } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"
import { MainSchema } from "../../../src/db/Schemas"

const OWNED_MAIN: MainSchema = {
    id: TestConstants.ID,
    nameKey: TestConstants.NAME,
    name: TestConstants.DISPLAYNAME,
    description: TestConstants.DESCRIPTION,
    owner: TestConstants.OWNER,
    ownerId: TestConstants.OWNER,
    location: TestConstants.LOCATION,
    batch: [],
    tags: ["tag1"],
    items: ["123", "12345"]
}

test('will list item types for an owner when they exist', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME_TWO_ITEMS_OWNED)
    const api: ListMyOwnedItems = new ListMyOwnedItems(dbClient)

    await expect(api.execute({ ownerId: TestConstants.OWNER })).resolves.toEqual({
        items: [OWNED_MAIN],
        nextPageToken: undefined
    })
})

test('will return no items when owner does not match', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME_TWO_ITEMS_OWNED)
    const api: ListMyOwnedItems = new ListMyOwnedItems(dbClient)

    await expect(api.execute({ ownerId: TestConstants.OWNER_2 })).resolves.toEqual({
        items: [],
        nextPageToken: undefined
    })
})

test('will fail when owner is missing', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME_TWO_ITEMS_OWNED)
    const api: ListMyOwnedItems = new ListMyOwnedItems(dbClient)

    await expect(api.execute({})).rejects.toThrow("Missing required field 'ownerId'")
})
