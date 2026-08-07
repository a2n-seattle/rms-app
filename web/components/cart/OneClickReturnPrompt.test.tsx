jest.mock("@/lib/actions/cart", () => ({ submitOneClickReturn: jest.fn() }))

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { submitOneClickReturn } from "@/lib/actions/cart"
import { OneClickReturnPrompt } from "./OneClickReturnPrompt"

const mockSubmit = submitOneClickReturn as jest.Mock

beforeEach(() => {
    mockSubmit.mockReset()
})

test("renders a notes field and a return button labeled with the item count", () => {
    render(<OneClickReturnPrompt open={true} onClose={jest.fn()} ids={["chair-1", "chair-2"]} familyName="Chairs" />)

    expect(screen.getByText("Notes")).not.toBeNull()
    expect(screen.getByRole("button", { name: "Return 2 items" })).not.toBeNull()
})

test("submits the given ids and closes on success", async () => {
    mockSubmit.mockResolvedValue({ success: true })
    const onClose = jest.fn()
    render(<OneClickReturnPrompt open={true} onClose={onClose} ids={["chair-1"]} familyName="Chairs" />)

    fireEvent.click(screen.getByRole("button", { name: "Return 1 item" }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    const submittedFormData = mockSubmit.mock.calls[0][1] as FormData
    expect(submittedFormData.getAll("ids")).toEqual(["chair-1"])
})

test("shows an inline error on failure instead of closing", async () => {
    mockSubmit.mockResolvedValue({ success: false, error: "Unable to return item: borrower mismatch." })
    const onClose = jest.fn()
    render(<OneClickReturnPrompt open={true} onClose={onClose} ids={["chair-1"]} familyName="Chairs" />)

    fireEvent.click(screen.getByRole("button", { name: "Return 1 item" }))

    await waitFor(() => {
        expect(screen.getByRole("alert").textContent).toContain("Unable to return item: borrower mismatch.")
    })
    expect(onClose).not.toHaveBeenCalled()
})
