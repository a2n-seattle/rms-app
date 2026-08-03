jest.mock("@/amplify_outputs.json", () => ({ custom: { apiUrl: "https://api.example.test/prod/" } }), {
    virtual: true,
})

import { getItem } from "./getItem"

const originalFetch = global.fetch

afterEach(() => {
    global.fetch = originalFetch
})

test("will call the get-item route with the given key", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ main: { id: "chair" }, items: [] }),
    })
    global.fetch = mockFetch as unknown as typeof fetch

    const result = await getItem("token", { key: "chair-abc123" })

    expect(result).toEqual({ main: { id: "chair" }, items: [] })
    const [url] = mockFetch.mock.calls[0]
    expect(url.toString()).toContain("get-item")
})
