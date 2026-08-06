import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { CreateItemForm } from "./CreateItemForm"
import type { ActionState } from "@/lib/actionState"

test("renders all fields", () => {
    render(<CreateItemForm action={jest.fn()} />)

    expect(screen.getByLabelText("Name")).not.toBeNull()
    expect(screen.getByLabelText("Description")).not.toBeNull()
    expect(screen.getByLabelText("Location")).not.toBeNull()
    expect(screen.getByLabelText("Tags (comma-separated)")).not.toBeNull()
    expect(screen.getByLabelText("First sub-item friendly name (optional)")).not.toBeNull()
    expect(screen.getByLabelText("First sub-item notes (optional)")).not.toBeNull()
})

test("submits the entered values", async () => {
    const action = jest.fn(async (_prevState: ActionState, _formData: FormData): Promise<ActionState> => ({ success: true }))
    render(<CreateItemForm action={action} />)

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Chairs" } })
    fireEvent.change(screen.getByLabelText("Tags (comma-separated)"), { target: { value: "furniture, seating" } })
    fireEvent.click(screen.getByRole("button", { name: "Create item" }))

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1))
    const formData = action.mock.calls[0][1]
    expect(formData.get("name")).toEqual("Chairs")
    expect(formData.get("tags")).toEqual("furniture, seating")
})
