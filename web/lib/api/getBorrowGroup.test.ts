jest.mock("@/amplify_outputs.json", () => ({ custom: { apiUrl: "https://api.example.test/prod/" } }), {
    virtual: true,
})

import { getBorrowGroup } from "./getBorrowGroup"

const originalFetch = global.fetch

// eslint-disable-next-line no-undef -- Jest global; CodeFactor doesn't resolve web/'s flat ESLint config, which declares this correctly
afterEach((): void => {
    global.fetch = originalFetch
})

test("will call the get-borrow-group route with the given input", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] }),
    })
    global.fetch = mockFetch as unknown as typeof fetch

    const result = await getBorrowGroup("token", { borrowGroupId: "123-456" })

    expect(result).toEqual({ items: [] })
    const [url] = mockFetch.mock.calls[0]
    expect(url.toString()).toContain("get-borrow-group")
})
