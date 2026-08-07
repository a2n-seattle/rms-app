jest.mock("@/amplify_outputs.json", () => ({ custom: { apiUrl: "https://api.example.test/prod/" } }), {
    virtual: true,
})

import { deleteItem } from "./deleteItem"

const originalFetch = global.fetch

// eslint-disable-next-line no-undef -- Jest global; CodeFactor doesn't resolve web/'s flat ESLint config, which declares this correctly
afterEach((): void => {
    global.fetch = originalFetch
})

test("will call the delete-item route with the given input", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => "family-123",
    })
    global.fetch = mockFetch as unknown as typeof fetch

    const result = await deleteItem("token", { id: "item-123" })

    expect(result).toEqual("family-123")
    const [url] = mockFetch.mock.calls[0]
    expect(url.toString()).toContain("delete-item")
})
