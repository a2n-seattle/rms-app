jest.mock("@/amplify_outputs.json", () => ({ custom: { apiUrl: "https://api.example.test/prod/" } }), {
    virtual: true,
})

import { addItem } from "./addItem"

const originalFetch = global.fetch

// eslint-disable-next-line no-undef -- Jest global; CodeFactor doesn't resolve web/'s flat ESLint config, which declares this correctly
afterEach((): void => {
    global.fetch = originalFetch
})

test("will call the add-item route with the given input", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => "item-123",
    })
    global.fetch = mockFetch as unknown as typeof fetch

    const result = await addItem("token", { name: "Chairs", friendlyName: "Chairs 1" })

    expect(result).toEqual("item-123")
    const [url] = mockFetch.mock.calls[0]
    expect(url.toString()).toContain("add-item")
})
