jest.mock("@/lib/actions/cart", () => ({
    resolveFamilyAvailability: jest.fn(),
    submitBorrowOrReserve: jest.fn(),
}))

import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { resolveFamilyAvailability, submitBorrowOrReserve } from "@/lib/actions/cart"
import { OneClickPrompt } from "./OneClickPrompt"

const mockResolve = resolveFamilyAvailability as jest.Mock
const mockSubmit = submitBorrowOrReserve as jest.Mock

beforeEach(() => {
    mockResolve.mockReset()
    mockSubmit.mockReset()
})

test("shows a loading state before availability resolves", () => {
    mockResolve.mockReturnValue(new Promise(() => {}))
    render(<OneClickPrompt open={true} onClose={jest.fn()} mode="borrow" familyId="chairs" familyName="Chairs" />)

    expect(screen.getByText("Checking availability…")).not.toBeNull()
})

test("shows a fully-unavailable message when nothing resolves", async () => {
    mockResolve.mockResolvedValue({ items: [], total: 2 })
    render(<OneClickPrompt open={true} onClose={jest.fn()} mode="borrow" familyId="chairs" familyName="Chairs" />)

    await waitFor(() => {
        expect(screen.getByText("None of Chairs is currently available.")).not.toBeNull()
    })
})

test("shows a partial-availability flag when some sub-items are borrowed", async () => {
    mockResolve.mockResolvedValue({ items: [{ id: "chair-1", name: "Chair 1" }], total: 3 })
    render(<OneClickPrompt open={true} onClose={jest.fn()} mode="borrow" familyId="chairs" familyName="Chairs" />)

    await waitFor(() => {
        expect(screen.getByText("1 of 3 available — 2 currently borrowed")).not.toBeNull()
    })
})

test("no flag when everything in the family is available", async () => {
    mockResolve.mockResolvedValue({ items: [{ id: "chair-1", name: "Chair 1" }], total: 1 })
    render(<OneClickPrompt open={true} onClose={jest.fn()} mode="borrow" familyId="chairs" familyName="Chairs" />)

    await waitFor(() => {
        expect(screen.getByRole("button", { name: /Borrow 1 item/ })).not.toBeNull()
    })
    expect(screen.queryByText(/currently borrowed/)).toBeNull()
})

test("shows Start/End fields (not Return by) in reserve mode", async () => {
    mockResolve.mockResolvedValue({ items: [{ id: "chair-1", name: "Chair 1" }], total: 1 })
    render(<OneClickPrompt open={true} onClose={jest.fn()} mode="reserve" familyId="chairs" familyName="Chairs" />)

    await waitFor(() => {
        expect(screen.getByText("Start")).not.toBeNull()
    })
    expect(screen.getByText("End")).not.toBeNull()
    expect(screen.queryByText("Return by")).toBeNull()
})

test("submits the resolved available ids and closes on success", async () => {
    mockResolve.mockResolvedValue({ items: [{ id: "chair-1", name: "Chair 1" }], total: 1 })
    mockSubmit.mockResolvedValue({ success: true })
    const onClose = jest.fn()
    render(<OneClickPrompt open={true} onClose={onClose} mode="borrow" familyId="chairs" familyName="Chairs" />)

    await waitFor(() => {
        expect(screen.getByRole("button", { name: /Borrow 1 item/ })).not.toBeNull()
    })
    fireEvent.click(screen.getByRole("button", { name: /Borrow 1 item/ }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    const submittedFormData = mockSubmit.mock.calls[0][1] as FormData
    expect(submittedFormData.getAll("ids")).toEqual(["chair-1"])
    expect(submittedFormData.get("mode")).toBe("borrow")
})
