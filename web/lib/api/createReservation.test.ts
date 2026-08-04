jest.mock("@/amplify_outputs.json", () => ({ custom: { apiUrl: "https://api.example.test/prod/" } }), {
    virtual: true,
})

import { createReservation } from "./createReservation"

const originalFetch = global.fetch

// eslint-disable-next-line no-undef -- Jest global; CodeFactor doesn't resolve web/'s flat ESLint config, which declares this correctly
afterEach((): void => {
    global.fetch = originalFetch
})

test("will call the create-reservation route with the given input", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => "1234-chair",
    })
    global.fetch = mockFetch as unknown as typeof fetch

    const result = await createReservation("token", {
        ids: ["chair-1"],
        borrower: "a@b.com",
        startTime: 1,
        endTime: 2,
    })

    expect(result).toEqual("1234-chair")
    const [url] = mockFetch.mock.calls[0]
    expect(url.toString()).toContain("create-reservation")
})
