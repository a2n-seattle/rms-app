import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ActionForm } from "./ActionForm"
import type { ActionState } from "@/lib/actionState"

test("shows a success alert after the action resolves { success: true }", async () => {
    const action = jest.fn(async (): Promise<ActionState> => ({ success: true }))

    render(
        <ActionForm action={action} successMessage="It worked.">
            <button type="submit">Go</button>
        </ActionForm>
    )

    fireEvent.click(screen.getByRole("button", { name: "Go" }))

    await waitFor(() => {
        expect(screen.getByRole("status").textContent).toContain("It worked.")
    })
    expect(screen.queryByRole("alert")).toBeNull()
})

test("shows an error alert with the action's message after it resolves { success: false, error }", async () => {
    const action = jest.fn(
        async (): Promise<ActionState> => ({
            success: false,
            error: "Unable to borrow item: Item is currently being borrowed by 'someone-else'.",
        })
    )

    render(
        <ActionForm action={action} successMessage="It worked.">
            <button type="submit">Go</button>
        </ActionForm>
    )

    fireEvent.click(screen.getByRole("button", { name: "Go" }))

    await waitFor(() => {
        expect(screen.getByRole("alert").textContent).toContain(
            "Unable to borrow item: Item is currently being borrowed by 'someone-else'."
        )
    })
    expect(screen.queryByRole("status")).toBeNull()
})

test("shows neither alert before the form has been submitted", () => {
    const action = jest.fn(async (): Promise<ActionState> => ({ success: true }))

    render(
        <ActionForm action={action} successMessage="It worked.">
            <button type="submit">Go</button>
        </ActionForm>
    )

    expect(screen.queryByRole("status")).toBeNull()
    expect(screen.queryByRole("alert")).toBeNull()
})
