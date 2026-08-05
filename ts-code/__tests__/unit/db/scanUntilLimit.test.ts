import { scanUntilLimit } from "../../../src/db/scanUntilLimit"
import { DBClient } from "../../../src/injection/db/DBClient"
import { ScanCommandInput, ScanCommandOutput } from "@aws-sdk/lib-dynamodb"

/**
 * A fake DBClient whose `scan` serves fixed pages in order, regardless of the params passed in
 * (other than following ExclusiveStartKey to pick the next page) -- lets tests construct the
 * exact "many non-matching items before a match" shape that a real DynamoDB Scan+Limit can
 * produce, without needing a large LocalDBClient seed fixture.
 */
function fakeScanClient(pages: { items: any[], lastEvaluatedKey?: Record<string, any> }[]): DBClient {
    let call = 0
    return {
        delete: jest.fn(),
        get: jest.fn(),
        put: jest.fn(),
        update: jest.fn(),
        scan: jest.fn((_params: ScanCommandInput): Promise<ScanCommandOutput> => {
            const page = pages[call]
            call += 1
            return Promise.resolve({
                Items: page.items,
                ...(page.lastEvaluatedKey ? { LastEvaluatedKey: page.lastEvaluatedKey } : {}),
                $metadata: {}
            })
        })
    } as unknown as DBClient
}

const BASE_PARAMS: ScanCommandInput = { TableName: "some-table" }

test("returns matches found on the very first page with no nextPageToken", async () => {
    const client = fakeScanClient([{ items: [{ id: "a" }, { id: "b" }] }])

    await expect(scanUntilLimit(client, BASE_PARAMS, 25)).resolves.toEqual({
        items: [{ id: "a" }, { id: "b" }],
        nextPageToken: undefined
    })
})

test("keeps scanning subsequent pages when a page has no matches but more data remains", async () => {
    // Simulates 25 non-matching items scanned (empty page, but LastEvaluatedKey still set),
    // then a second page containing the real match -- the exact DynamoDB gotcha this exists to
    // fix: a short/empty page doesn't mean no more data.
    const client = fakeScanClient([
        { items: [], lastEvaluatedKey: { id: "page1-end" } },
        { items: [{ id: "match" }] }
    ])

    await expect(scanUntilLimit(client, BASE_PARAMS, 25)).resolves.toEqual({
        items: [{ id: "match" }],
        nextPageToken: undefined
    })
})

test("stops once limit matches are collected and returns a nextPageToken", async () => {
    const client = fakeScanClient([
        { items: [{ id: "a" }, { id: "b" }, { id: "c" }], lastEvaluatedKey: { id: "c" } }
    ])

    const result = await scanUntilLimit(client, BASE_PARAMS, 2)
    expect(result.items).toEqual([{ id: "a" }, { id: "b" }])
    expect(result.nextPageToken).toBeDefined()
})

test("returns no nextPageToken when the table is exhausted before limit is reached", async () => {
    const client = fakeScanClient([
        { items: [{ id: "a" }] }
    ])

    await expect(scanUntilLimit(client, BASE_PARAMS, 25)).resolves.toEqual({
        items: [{ id: "a" }],
        nextPageToken: undefined
    })
})

test("applies an async predicate, filtering items scanUntilLimit would otherwise keep", async () => {
    const client = fakeScanClient([
        { items: [{ id: "a", keep: false }, { id: "b", keep: true }] }
    ])

    const result = await scanUntilLimit(
        client,
        BASE_PARAMS,
        25,
        (item: any) => Promise.resolve(item.keep)
    )

    expect(result.items).toEqual([{ id: "b", keep: true }])
})

test("scans multiple pages until limit matches survive a predicate", async () => {
    const client = fakeScanClient([
        { items: [{ id: "a", keep: false }], lastEvaluatedKey: { id: "a" } },
        { items: [{ id: "b", keep: false }], lastEvaluatedKey: { id: "b" } },
        { items: [{ id: "c", keep: true }] }
    ])

    const result = await scanUntilLimit(
        client,
        BASE_PARAMS,
        25,
        (item: any) => item.keep
    )

    expect(result.items).toEqual([{ id: "c", keep: true }])
})
