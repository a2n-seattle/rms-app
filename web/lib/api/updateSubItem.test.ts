jest.mock("@/amplify_outputs.json", () => ({ custom: { apiUrl: "https://api.example.test/prod/" } }), {
    virtual: true,
})

import { updateSubItem } from "./updateSubItem"

const originalFetch = global.fetch

// eslint-disable-next-line no-undef -- Jest global; CodeFactor doesn't resolve web/'s flat ESLint config, which declares this correctly
afterEach((): void => {
    global.fetch = originalFetch
})

test("will call the update-sub-item route with the given input", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => "item-123",
    })
    global.fetch = mockFetch as unknown as typeof fetch

    const result = await updateSubItem("token", { id: "item-123", name: "Chair 1" })

    expect(result).toEqual("item-123")
    const [url] = mockFetch.mock.calls[0]
    expect(url.toString()).toContain("update-sub-item")
})
