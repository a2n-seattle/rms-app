import { getUntilLimit } from "../../../src/db/getUntilLimit"
import { encodePageToken } from "../../../src/db/PageToken"

interface Widget {
    id: string
}

function widgetStore(ids: string[]): (id: string) => Promise<Widget | undefined> {
    const present = new Set(ids)
    return (id: string) => Promise.resolve(present.has(id) ? { id } : undefined)
}

test('returns all items when fewer ids exist than the limit', async () => {
    const getById = widgetStore(["a", "b"])

    await expect(getUntilLimit(["a", "b"], getById, 5)).resolves.toEqual({
        items: [{ id: "a" }, { id: "b" }],
        nextPageToken: undefined
    })
})

test('loops past predicate non-matches within the id list until `limit` real matches are found', async () => {
    const getById = widgetStore(["a", "b", "c", "d"])

    await expect(
        getUntilLimit(["a", "b", "c", "d"], getById, 2, undefined, (item) => item.id !== "a" && item.id !== "c")
    ).resolves.toEqual({
        items: [{ id: "b" }, { id: "d" }],
        nextPageToken: undefined
    })
})

test('returns a nextPageToken when more ids remain, and resumes from it on the next call', async () => {
    const getById = widgetStore(["a", "b", "c"])

    const page1 = await getUntilLimit(["a", "b", "c"], getById, 1)
    expect(page1.items).toEqual([{ id: "a" }])
    expect(page1.nextPageToken).toEqual(encodePageToken({ offset: 1 }))

    const page2 = await getUntilLimit(["a", "b", "c"], getById, 1, page1.nextPageToken)
    expect(page2.items).toEqual([{ id: "b" }])
    expect(page2.nextPageToken).toEqual(encodePageToken({ offset: 2 }))

    const page3 = await getUntilLimit(["a", "b", "c"], getById, 1, page2.nextPageToken)
    expect(page3).toEqual({ items: [{ id: "c" }], nextPageToken: undefined })
})

test('returns no items and no nextPageToken when the id list is empty', async () => {
    await expect(getUntilLimit([], widgetStore([]), 5)).resolves.toEqual({ items: [], nextPageToken: undefined })
})

test('skips a stale id whose row no longer exists rather than surfacing a hole', async () => {
    const getById = widgetStore(["a", "c"]) // "b" is stale -- present in the id list, absent from the store

    await expect(getUntilLimit(["a", "b", "c"], getById, 5)).resolves.toEqual({
        items: [{ id: "a" }, { id: "c" }],
        nextPageToken: undefined
    })
})
