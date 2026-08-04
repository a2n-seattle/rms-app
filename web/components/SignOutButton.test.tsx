import { render, screen, fireEvent, waitFor } from "@testing-library/react"

const mockSignOut = jest.fn()
const mockPush = jest.fn()

jest.mock("aws-amplify/auth", () => ({
    signOut: (...args: unknown[]) => mockSignOut(...args),
}))

jest.mock("next/navigation", () => ({
    useRouter: () => ({ push: mockPush }),
}))

import { SignOutButton } from "./SignOutButton"

afterEach(() => {
    jest.clearAllMocks()
})

test("signs out and redirects to /login", async () => {
    mockSignOut.mockResolvedValue(undefined)

    render(<SignOutButton />)
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }))

    await waitFor(() => expect(mockSignOut).toHaveBeenCalled())
    expect(mockPush).toHaveBeenCalledWith("/login")
})
