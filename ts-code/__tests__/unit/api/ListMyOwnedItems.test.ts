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

test('will find a match scanned after more than `limit` non-matching items (regression, GH-357)', async () => {
    const seed: any = {
        main: {
            "a-nomatch": { id: "a-nomatch", nameKey: "a", name: "a", description: "", owner: "x", ownerId: "someone-else", location: "", batch: [], tags: [], items: [] },
            "b-nomatch": { id: "b-nomatch", nameKey: "b", name: "b", description: "", owner: "x", ownerId: "someone-else", location: "", batch: [], tags: [], items: [] },
            "z-match": { id: "z-match", nameKey: "z", name: "z", description: "", owner: "x", ownerId: TestConstants.OWNER, location: "", batch: [], tags: [], items: [] }
        },
        items: {}, batch: {}, tags: {}, history: {}, schedule: {}, transactions: {}, user: {}
    }
    const dbClient: LocalDBClient = new LocalDBClient(seed)
    const api: ListMyOwnedItems = new ListMyOwnedItems(dbClient)

    await expect(api.execute({ ownerId: TestConstants.OWNER, limit: 1 })).resolves.toEqual({
        items: [seed.main["z-match"]],
        nextPageToken: undefined
    })
})
