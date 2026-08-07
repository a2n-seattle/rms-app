jest.mock("@/amplify_outputs.json", () => ({ custom: { apiUrl: "https://api.example.test/prod/" } }), {
    virtual: true,
})

import { deleteBatch } from "./deleteBatch"

const originalFetch = global.fetch

// eslint-disable-next-line no-undef -- Jest global; CodeFactor doesn't resolve web/'s flat ESLint config, which declares this correctly
afterEach((): void => {
    global.fetch = originalFetch
})

test("will call the delete-batch route with the given input", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => "Successfully deleted batch 'chairs'",
    })
    global.fetch = mockFetch as unknown as typeof fetch

    const result = await deleteBatch("token", { name: "chairs" })

    expect(result).toEqual("Successfully deleted batch 'chairs'")
    const [url] = mockFetch.mock.calls[0]
    expect(url.toString()).toContain("delete-batch")
})
