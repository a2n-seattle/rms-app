import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { CreateBatchModal } from "./CreateBatchModal"
import type { ActionState } from "@/lib/actionState"

test("renders the name, ids, and groups fields when open", () => {
    render(<CreateBatchModal open={true} onClose={jest.fn()} createBatchAction={jest.fn()} />)

    expect(screen.getByRole("dialog", { name: "Create batch" })).not.toBeNull()
    expect(screen.getByLabelText("Name")).not.toBeNull()
    expect(screen.getByLabelText("Item IDs (comma or space-separated)")).not.toBeNull()
    expect(screen.getByLabelText("Groups (optional, comma or space-separated)")).not.toBeNull()
})

test("renders nothing when closed", () => {
    const { container } = render(<CreateBatchModal open={false} onClose={jest.fn()} createBatchAction={jest.fn()} />)

    expect(container.innerHTML).toBe("")
})

test("submits the entered values", async () => {
    const action = jest.fn(async (_prevState: ActionState, _formData: FormData): Promise<ActionState> => ({ success: true }))
    render(<CreateBatchModal open={true} onClose={jest.fn()} createBatchAction={action} />)

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Chairs Batch" } })
    fireEvent.change(screen.getByLabelText("Item IDs (comma or space-separated)"), { target: { value: "chair-1, chair-2" } })
    fireEvent.click(screen.getByRole("button", { name: "Create batch" }))

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1))
    const formData = action.mock.calls[0][1]
    expect(formData.get("name")).toEqual("Chairs Batch")
    expect(formData.get("ids")).toEqual("chair-1, chair-2")
})

test("closes on a successful submit", async () => {
    const onClose = jest.fn()
    const action = jest.fn(async (_prevState: ActionState, _formData: FormData): Promise<ActionState> => ({ success: true }))
    render(<CreateBatchModal open={true} onClose={onClose} createBatchAction={action} />)

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Chairs Batch" } })
    fireEvent.change(screen.getByLabelText("Item IDs (comma or space-separated)"), { target: { value: "chair-1" } })
    fireEvent.click(screen.getByRole("button", { name: "Create batch" }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
})
