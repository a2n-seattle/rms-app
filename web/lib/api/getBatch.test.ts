jest.mock("@/amplify_outputs.json", () => ({ custom: { apiUrl: "https://api.example.test/prod/" } }), {
    virtual: true,
})

import { getBatch } from "./getBatch"

const originalFetch = global.fetch

// eslint-disable-next-line no-undef -- Jest global; CodeFactor doesn't resolve web/'s flat ESLint config, which declares this correctly
afterEach((): void => {
    global.fetch = originalFetch
})

test("will call the get-batch route with the given input", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ id: "chair-1", name: "chairs", owner: "facilities", borrower: "" }],
    })
    global.fetch = mockFetch as unknown as typeof fetch

    const result = await getBatch("token", { name: "test batch" })

    expect(result).toEqual([{ id: "chair-1", name: "chairs", owner: "facilities", borrower: "" }])
    const [url] = mockFetch.mock.calls[0]
    expect(url.toString()).toContain("get-batch")
})
