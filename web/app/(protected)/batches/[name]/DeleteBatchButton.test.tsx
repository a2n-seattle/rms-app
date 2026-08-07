import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { DeleteBatchButton } from "./DeleteBatchButton"
import type { ActionState } from "@/lib/actionState"

const noopAction = jest.fn(async (_prevState: ActionState, _formData: FormData): Promise<ActionState> => ({ success: true }))

test("opens a confirm dialog instead of acting immediately", () => {
    render(<DeleteBatchButton name="chairs" deleteBatchAction={noopAction} />)

    fireEvent.click(screen.getByRole("button", { name: "Delete batch" }))

    expect(screen.getByRole("dialog", { name: "Delete batch?" })).not.toBeNull()
    expect(screen.getByText('This will delete the batch "chairs" and cannot be undone.')).not.toBeNull()
})

test("Cancel closes the dialog without submitting", () => {
    render(<DeleteBatchButton name="chairs" deleteBatchAction={noopAction} />)

    fireEvent.click(screen.getByRole("button", { name: "Delete batch" }))
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(screen.queryByRole("dialog")).toBeNull()
})

test("Confirm delete submits with the batch name", async () => {
    const action = jest.fn(async (_prevState: ActionState, _formData: FormData): Promise<ActionState> => ({ success: true }))
    render(<DeleteBatchButton name="chairs" deleteBatchAction={action} />)

    fireEvent.click(screen.getByRole("button", { name: "Delete batch" }))
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }))

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1))
    const formData = action.mock.calls[0][1]
    expect(formData.get("name")).toEqual("chairs")
})
