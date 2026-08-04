import { render, screen, fireEvent, waitFor } from "@testing-library/react"

const mockUpdateUserAttributes = jest.fn()
const mockFetchAuthSession = jest.fn()
const mockRefresh = jest.fn()

jest.mock("aws-amplify/auth", () => ({
    updateUserAttributes: (...args: unknown[]) => mockUpdateUserAttributes(...args),
    fetchAuthSession: (...args: unknown[]) => mockFetchAuthSession(...args),
}))

jest.mock("next/navigation", () => ({
    useRouter: () => ({ refresh: mockRefresh }),
}))

import ProfilePage from "./page"

afterEach(() => {
    jest.clearAllMocks()
})

test("submits the new name and shows a saved message", async () => {
    mockUpdateUserAttributes.mockResolvedValue(undefined)
    mockFetchAuthSession.mockResolvedValue(undefined)

    render(<ProfilePage />)

    fireEvent.change(screen.getByLabelText("Name:"), { target: { value: "New Name" } })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(screen.getByText("Saved.")).toBeInTheDocument())

    expect(mockUpdateUserAttributes).toHaveBeenCalledWith({ userAttributes: { name: "New Name" } })
    expect(mockFetchAuthSession).toHaveBeenCalledWith({ forceRefresh: true })
    expect(mockRefresh).toHaveBeenCalled()
})

test("shows an error message when the update fails", async () => {
    mockUpdateUserAttributes.mockRejectedValue(new Error("Update failed"))

    render(<ProfilePage />)

    fireEvent.change(screen.getByLabelText("Name:"), { target: { value: "New Name" } })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(screen.getByText("Update failed")).toBeInTheDocument())

    expect(mockRefresh).not.toHaveBeenCalled()
})
