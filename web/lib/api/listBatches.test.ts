jest.mock("@/amplify_outputs.json", () => ({ custom: { apiUrl: "https://api.example.test/prod/" } }), {
    virtual: true,
})

import { listBatches } from "./listBatches"

const originalFetch = global.fetch

// eslint-disable-next-line no-undef -- Jest global; CodeFactor doesn't resolve web/'s flat ESLint config, which declares this correctly
afterEach((): void => {
    global.fetch = originalFetch
})

test("will call the list-batches route with the given input", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items: [], nextPageToken: undefined }),
    })
    global.fetch = mockFetch as unknown as typeof fetch

    const result = await listBatches("token", {})

    expect(result).toEqual({ items: [], nextPageToken: undefined })
    const [url] = mockFetch.mock.calls[0]
    expect(url.toString()).toContain("list-batches")
})
