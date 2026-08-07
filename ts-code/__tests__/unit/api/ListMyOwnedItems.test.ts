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

test('will return items in order across a paginated cursor, driven by UserTable.owned', async () => {
    const seed: any = {
        main: {
            "a": { id: "a", nameKey: "a", name: "a", description: "", owner: "x", ownerId: TestConstants.OWNER, location: "", batch: [], tags: [], items: [] },
            "b": { id: "b", nameKey: "b", name: "b", description: "", owner: "x", ownerId: TestConstants.OWNER, location: "", batch: [], tags: [], items: [] }
        },
        items: {}, batch: {}, tags: {}, history: {}, schedule: {}, transactions: {},
        user: { [TestConstants.OWNER]: { id: TestConstants.OWNER, owned: ["a", "b"], reserved: [], borrowed: [], history: [] } }
    }
    const dbClient: LocalDBClient = new LocalDBClient(seed)
    const api: ListMyOwnedItems = new ListMyOwnedItems(dbClient)

    const page1 = await api.execute({ ownerId: TestConstants.OWNER, limit: 1 })
    expect(page1.items).toEqual([seed.main["a"]])
    expect(page1.nextPageToken).toBeDefined()

    await expect(api.execute({ ownerId: TestConstants.OWNER, limit: 1, pageToken: page1.nextPageToken })).resolves.toEqual({
        items: [seed.main["b"]],
        nextPageToken: undefined
    })
})

test('will return no items when the owner has no UserTable row yet', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const api: ListMyOwnedItems = new ListMyOwnedItems(dbClient)

    await expect(api.execute({ ownerId: TestConstants.OWNER })).resolves.toEqual({
        items: [],
        nextPageToken: undefined
    })
})
