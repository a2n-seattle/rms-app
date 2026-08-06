// Explicit factories, not bare jest.mock(path) -- lib/session.ts transitively imports
// Next's server-only Request/Response globals (via aws-amplify's Next adapter), which
// aren't available in this project's jsdom test environment. A bare jest.mock still loads
// the real module once to generate its automock shape, which is enough to blow up on import.
jest.mock("@/lib/session", () => ({ getSession: jest.fn() }))
jest.mock("@/lib/api/getItem", () => ({ getItem: jest.fn() }))
jest.mock("@/lib/api/createReservation", () => ({ createReservation: jest.fn() }))
jest.mock("@/lib/api/borrowFromSchedule", () => ({ borrowFromSchedule: jest.fn() }))
jest.mock("@/lib/api/returnItem", () => ({ returnItem: jest.fn() }))
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }))

import { getSession } from "@/lib/session"
import { getItem } from "@/lib/api/getItem"
import { createReservation } from "@/lib/api/createReservation"
import { borrowFromSchedule } from "@/lib/api/borrowFromSchedule"
import { returnItem } from "@/lib/api/returnItem"
import { resolveFamilyAvailability, submitBorrowOrReserve, submitOneClickReturn } from "./cart"
import type { ItemsSchema } from "@/lib/api/types"

const mockGetSession = getSession as jest.Mock
const mockGetItem = getItem as jest.Mock
const mockCreateReservation = createReservation as jest.Mock
const mockBorrowFromSchedule = borrowFromSchedule as jest.Mock
const mockReturnItem = returnItem as jest.Mock

const SESSION = { idToken: "token", email: "a@b.com", name: "A", sub: "user-sub" }

function item(overrides: Partial<ItemsSchema>): ItemsSchema {
    return {
        id: "item-1",
        familyId: "family-1",
        name: "Item 1",
        borrower: "",
        borrowTime: 0,
        returnTime: 0,
        history: [],
        schedule: [],
        notes: "",
        ...overrides,
    }
}

beforeEach(() => {
    jest.clearAllMocks()
    mockGetSession.mockResolvedValue(SESSION)
})

describe("resolveFamilyAvailability", () => {
    test("returns only items with no borrower, plus the family's total item count", async () => {
        mockGetItem.mockResolvedValue({
            main: { id: "family-1" },
            items: [item({ id: "a", name: "A", borrower: "" }), item({ id: "b", name: "B", borrower: "someone" })],
        })

        const result = await resolveFamilyAvailability("family-1")

        expect(result).toEqual({ items: [{ id: "a", name: "A" }], total: 2 })
        expect(mockGetItem).toHaveBeenCalledWith("token", { key: "family-1" })
    })

    test("returns an empty result when signed out", async () => {
        mockGetSession.mockResolvedValue(null)

        const result = await resolveFamilyAvailability("family-1")

        expect(result).toEqual({ items: [], total: 0 })
        expect(mockGetItem).not.toHaveBeenCalled()
    })
})

describe("submitBorrowOrReserve", () => {
    function borrowFormData(): FormData {
        const fd = new FormData()
        fd.append("mode", "borrow")
        fd.append("ids", "item-1")
        fd.append("ids", "item-2")
        fd.append("returnBy", "2027-06-16T12:00")
        return fd
    }

    function reserveFormData(): FormData {
        const fd = new FormData()
        fd.append("mode", "reserve")
        fd.append("ids", "item-1")
        fd.append("start", "2027-06-16T09:00")
        fd.append("end", "2027-06-16T12:00")
        return fd
    }

    test("borrow mode creates a reservation then borrows from it", async () => {
        mockCreateReservation.mockResolvedValue("schedule-1")

        const result = await submitBorrowOrReserve({ success: false }, borrowFormData())

        expect(result).toEqual({ success: true })
        expect(mockCreateReservation).toHaveBeenCalledWith(
            "token",
            expect.objectContaining({ ids: ["item-1", "item-2"], borrower: "user-sub" })
        )
        expect(mockBorrowFromSchedule).toHaveBeenCalledWith("token", { scheduleId: "schedule-1" })
    })

    test("reserve mode only creates a reservation, no borrow-from-schedule call", async () => {
        const result = await submitBorrowOrReserve({ success: false }, reserveFormData())

        expect(result).toEqual({ success: true })
        expect(mockCreateReservation).toHaveBeenCalledWith(
            "token",
            expect.objectContaining({ ids: ["item-1"], borrower: "user-sub" })
        )
        expect(mockBorrowFromSchedule).not.toHaveBeenCalled()
    })

    test("surfaces a rejected reservation as an inline error instead of throwing", async () => {
        mockCreateReservation.mockRejectedValue(new Error("Unable to reserve item: overlapping reservation exists."))

        const result = await submitBorrowOrReserve({ success: false }, reserveFormData())

        expect(result).toEqual({ success: false, error: "Unable to reserve item: overlapping reservation exists." })
    })
})

describe("submitOneClickReturn", () => {
    test("returns the given ids for the current user", async () => {
        const fd = new FormData()
        fd.append("ids", "item-1")
        fd.append("notes", "all good")

        const result = await submitOneClickReturn({ success: false }, fd)

        expect(result).toEqual({ success: true })
        expect(mockReturnItem).toHaveBeenCalledWith("token", { ids: ["item-1"], borrower: "user-sub", notes: "all good" })
    })
})
