jest.mock("@/amplify_outputs.json", () => ({ custom: { apiUrl: "https://api.example.test/prod/" } }), {
    virtual: true,
})

import { callRmsApi } from "./client"

const originalFetch = global.fetch

afterEach((): void => {
    global.fetch = originalFetch
})

test("will attach the raw ID token (no Bearer prefix) and POST JSON", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] }),
    })
    global.fetch = mockFetch as unknown as typeof fetch

    await callRmsApi("list-items", "raw-id-token", { limit: 5 })

    expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({ Authorization: "raw-id-token" }),
            body: JSON.stringify({ limit: 5 }),
        })
    )
})

test("will throw with the API's error message when the response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: "Missing required field 'name'" }),
    }) as unknown as typeof fetch

    await expect(callRmsApi("add-item", "token", {})).rejects.toThrow("Missing required field 'name'")
})
