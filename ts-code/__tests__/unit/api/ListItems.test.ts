import { ListItems, ListItemsResult } from "../../../src/api/ListItems"
import { DBSeed, TestConstants } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"
import { MainSchema } from "../../../src/db/Schemas"

function mainEntry(id: string): MainSchema {
    return {
        id,
        nameKey: id,
        name: id,
        description: "",
        owner: "",
        location: "",
        batch: [],
        tags: [],
        items: []
    }
}

const THREE_NAMES = {
    main: {
        "aaa": mainEntry("aaa"),
        "bbb": mainEntry("bbb"),
        "ccc": mainEntry("ccc")
    },
    items: {},
    batch: {},
    tags: {},
    history: {},
    schedule: {},
    transactions: {}
}

test('will list no items when table is empty', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const api: ListItems = new ListItems(dbClient)

    await expect(api.execute({})).resolves.toEqual({ items: [], nextPageToken: undefined })
})

test('will list all items in one page when limit exceeds table size', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES)
    const api: ListItems = new ListItems(dbClient)

    const result: ListItemsResult = await api.execute({})
    expect(result.items.map((i) => i.id).sort()).toEqual([TestConstants.ID, TestConstants.ID_2].sort())
    expect(result.nextPageToken).toBeUndefined()
})

test('will paginate when limit is smaller than table size, and following the token advances', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(THREE_NAMES as any)
    const api: ListItems = new ListItems(dbClient)

    const firstPage: ListItemsResult = await api.execute({ limit: 2 })
    expect(firstPage.items.map((i) => i.id)).toEqual(["aaa", "bbb"])
    expect(firstPage.nextPageToken).toBeDefined()

    const secondPage: ListItemsResult = await api.execute({ limit: 2, pageToken: firstPage.nextPageToken })
    expect(secondPage.items.map((i) => i.id)).toEqual(["ccc"])
    expect(secondPage.nextPageToken).toBeUndefined()
})
