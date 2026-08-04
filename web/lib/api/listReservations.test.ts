jest.mock("@/amplify_outputs.json", () => ({ custom: { apiUrl: "https://api.example.test/prod/" } }), {
    virtual: true,
})

import { listReservations } from "./listReservations"

const originalFetch = global.fetch

// eslint-disable-next-line no-undef -- Jest global; CodeFactor doesn't resolve web/'s flat ESLint config, which declares this correctly
afterEach((): void => {
    global.fetch = originalFetch
})

test("will call the list-reservations route with the given borrower", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items: [{ id: "1-chair", borrower: "a@b.com", itemIds: ["chair-1"], startTime: 1, endTime: 2 }] }),
    })
    global.fetch = mockFetch as unknown as typeof fetch

    const result = await listReservations("token", { borrower: "a@b.com" })

    expect(result).toEqual({ items: [{ id: "1-chair", borrower: "a@b.com", itemIds: ["chair-1"], startTime: 1, endTime: 2 }] })
    const [url] = mockFetch.mock.calls[0]
    expect(url.toString()).toContain("list-reservations")
})
