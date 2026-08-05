jest.mock("@/amplify_outputs.json", () => ({ custom: { apiUrl: "https://api.example.test/prod/" } }), {
    virtual: true,
})

import { extendReservation } from "./extendReservation"

const originalFetch = global.fetch

// eslint-disable-next-line no-undef -- Jest global; CodeFactor doesn't resolve web/'s flat ESLint config, which declares this correctly
afterEach((): void => {
    global.fetch = originalFetch
})

test("will call the extend-reservation route with the given input", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => "123-456",
    })
    global.fetch = mockFetch as unknown as typeof fetch

    const result = await extendReservation("token", { id: "123-456", newEndTime: 2 })

    expect(result).toEqual("123-456")
    const [url] = mockFetch.mock.calls[0]
    expect(url.toString()).toContain("extend-reservation")
})
