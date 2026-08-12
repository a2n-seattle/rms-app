import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import type { ActionState } from "./actionState"

const mockRefresh = jest.fn()

jest.mock("next/navigation", () => ({
    useRouter: () => ({ refresh: mockRefresh }),
}))

import { useActionFormState } from "./useActionFormState"

afterEach(() => {
    jest.clearAllMocks()
})

function TestForm({ action }: { action: (prevState: ActionState, formData: FormData) => Promise<ActionState> }) {
    const [state, formAction] = useActionFormState(action)
    return (
        <form action={formAction}>
            <button type="submit">Go</button>
            {state.error && <span role="alert">{state.error}</span>}
        </form>
    )
}

test("calls router.refresh() once the action resolves { success: true }", async () => {
    const action = jest.fn(async (): Promise<ActionState> => ({ success: true }))
    render(<TestForm action={action} />)

    fireEvent.click(screen.getByRole("button", { name: "Go" }))

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1))
})

test("does not call router.refresh() when the action resolves { success: false }", async () => {
    const action = jest.fn(async (): Promise<ActionState> => ({ success: false, error: "nope" }))
    render(<TestForm action={action} />)

    fireEvent.click(screen.getByRole("button", { name: "Go" }))

    await waitFor(() => expect(screen.getByRole("alert")).not.toBeNull())
    expect(mockRefresh).not.toHaveBeenCalled()
})

test("does not call router.refresh() before the form has been submitted", () => {
    const action = jest.fn(async (): Promise<ActionState> => ({ success: true }))
    render(<TestForm action={action} />)

    expect(mockRefresh).not.toHaveBeenCalled()
})
