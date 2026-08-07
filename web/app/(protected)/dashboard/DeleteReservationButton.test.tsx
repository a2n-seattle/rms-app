import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { DeleteReservationButton } from "./DeleteReservationButton"
import type { ActionState } from "@/lib/actionState"

test("clicking Cancel opens a confirm dialog rather than acting immediately", () => {
    const action = jest.fn(async (): Promise<ActionState> => ({ success: true }))
    render(<DeleteReservationButton scheduleId="schedule-1" action={action} />)

    fireEvent.click(screen.getByRole("button", { name: "Cancel reservation schedule-1" }))

    expect(screen.getByRole("dialog", { name: "Cancel this reservation?" })).not.toBeNull()
    expect(action).not.toHaveBeenCalled()
})

test("Never mind closes the dialog without submitting", () => {
    const action = jest.fn(async (): Promise<ActionState> => ({ success: true }))
    render(<DeleteReservationButton scheduleId="schedule-1" action={action} />)

    fireEvent.click(screen.getByRole("button", { name: "Cancel reservation schedule-1" }))
    fireEvent.click(screen.getByRole("button", { name: "Never mind" }))

    expect(screen.queryByRole("dialog")).toBeNull()
    expect(action).not.toHaveBeenCalled()
})

test("Confirm cancel submits with the scheduleId and closes the dialog on success", async () => {
    const action = jest.fn(async (_prevState: ActionState, _formData: FormData): Promise<ActionState> => ({ success: true }))
    render(<DeleteReservationButton scheduleId="schedule-1" action={action} />)

    fireEvent.click(screen.getByRole("button", { name: "Cancel reservation schedule-1" }))
    fireEvent.click(screen.getByRole("button", { name: "Confirm cancel" }))

    await waitFor(() => {
        expect(screen.queryByRole("dialog")).toBeNull()
    })
    expect(action).toHaveBeenCalled()
    const submittedFormData = action.mock.calls[0][1] as FormData
    expect(submittedFormData.get("scheduleId")).toBe("schedule-1")
})

test("shows an inline error and keeps the dialog open on failure", async () => {
    const action = jest.fn(
        async (): Promise<ActionState> => ({ success: false, error: "Unable to cancel reservation: not found." })
    )
    render(<DeleteReservationButton scheduleId="schedule-1" action={action} />)

    fireEvent.click(screen.getByRole("button", { name: "Cancel reservation schedule-1" }))
    fireEvent.click(screen.getByRole("button", { name: "Confirm cancel" }))

    await waitFor(() => {
        expect(screen.getByRole("alert").textContent).toContain("Unable to cancel reservation: not found.")
    })
    expect(screen.getByRole("dialog")).not.toBeNull()
})
