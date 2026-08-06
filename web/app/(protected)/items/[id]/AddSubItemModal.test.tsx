import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { AddSubItemModal } from "./AddSubItemModal"
import type { ActionState } from "@/lib/actionState"

test("renders the friendly name and notes fields when open", () => {
    render(<AddSubItemModal open={true} onClose={jest.fn()} addSubItemAction={jest.fn()} />)

    expect(screen.getByRole("dialog", { name: "Add sub-item" })).not.toBeNull()
    expect(screen.getByLabelText("Friendly name (optional)")).not.toBeNull()
    expect(screen.getByLabelText("Notes (optional)")).not.toBeNull()
})

test("renders nothing when closed", () => {
    const { container } = render(<AddSubItemModal open={false} onClose={jest.fn()} addSubItemAction={jest.fn()} />)

    expect(container.innerHTML).toBe("")
})

test("closes on a successful submit", async () => {
    const onClose = jest.fn()
    const action = jest.fn(async (_prevState: ActionState, _formData: FormData): Promise<ActionState> => ({ success: true }))
    render(<AddSubItemModal open={true} onClose={onClose} addSubItemAction={action} />)

    fireEvent.click(screen.getByRole("button", { name: "Add sub-item" }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
})
