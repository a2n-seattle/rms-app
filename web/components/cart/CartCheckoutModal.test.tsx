jest.mock("@/lib/actions/cart", () => ({ submitBorrowOrReserve: jest.fn() }))

import { useEffect } from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { CartProvider, useCart, CartEntry } from "@/lib/cart/CartContext"
import { submitBorrowOrReserve } from "@/lib/actions/cart"
import { CartCheckoutModal } from "./CartCheckoutModal"

const mockSubmit = submitBorrowOrReserve as jest.Mock

const CHAIR: CartEntry = { itemId: "chair-1", familyId: "chairs", itemName: "Chair 1", familyName: "Chairs" }

function Harness({ open, onClose, seed = [] }: { open: boolean; onClose: () => void; seed?: CartEntry[] }) {
    return (
        <CartProvider>
            <Seeder seed={seed} />
            <CartCheckoutModal open={open} onClose={onClose} />
        </CartProvider>
    )
}

function Seeder({ seed }: { seed: CartEntry[] }) {
    const cart = useCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once on mount only
    useEffect(() => {
        if (seed.length > 0) {
            cart.addEntries(seed)
        }
    }, [])
    return null
}

beforeEach(() => {
    mockSubmit.mockReset()
})

test("shows an empty-cart message when there are no entries", () => {
    render(<Harness open={true} onClose={jest.fn()} />)
    expect(screen.getByText("Your cart is empty.")).not.toBeNull()
})

test("lists cart entries and submits with the selected mode", async () => {
    mockSubmit.mockResolvedValue({ success: true })
    render(<Harness open={true} onClose={jest.fn()} seed={[CHAIR]} />)

    expect(screen.getByText("Chairs — Chair 1")).not.toBeNull()

    fireEvent.click(screen.getByRole("button", { name: /Borrow 1 item/ }))

    await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled()
    })
    const submittedFormData = mockSubmit.mock.calls[0][1] as FormData
    expect(submittedFormData.get("mode")).toBe("borrow")
    expect(submittedFormData.getAll("ids")).toEqual(["chair-1"])
})

test("clears the cart and closes on a successful submission", async () => {
    mockSubmit.mockResolvedValue({ success: true })
    const onClose = jest.fn()
    render(<Harness open={true} onClose={onClose} seed={[CHAIR]} />)

    fireEvent.click(screen.getByRole("button", { name: /Borrow 1 item/ }))

    await waitFor(() => {
        expect(onClose).toHaveBeenCalled()
    })
})

test("shows an inline error and keeps the cart intact on failure", async () => {
    mockSubmit.mockResolvedValue({ success: false, error: "Unable to borrow item: already borrowed." })
    const onClose = jest.fn()
    render(<Harness open={true} onClose={onClose} seed={[CHAIR]} />)

    fireEvent.click(screen.getByRole("button", { name: /Borrow 1 item/ }))

    await waitFor(() => {
        expect(screen.getByRole("alert").textContent).toContain("Unable to borrow item: already borrowed.")
    })
    expect(onClose).not.toHaveBeenCalled()
})

test("removing an entry drops it from the list", () => {
    render(<Harness open={true} onClose={jest.fn()} seed={[CHAIR]} />)

    fireEvent.click(screen.getByRole("button", { name: "Remove Chair 1 from cart" }))

    expect(screen.getByText("Your cart is empty.")).not.toBeNull()
})

test("switching to Reserve mode shows start/end fields instead of return-by", () => {
    render(<Harness open={true} onClose={jest.fn()} seed={[CHAIR]} />)

    fireEvent.click(screen.getByLabelText("Reserve for later"))

    expect(screen.getByText("Start")).not.toBeNull()
    expect(screen.getByText("End")).not.toBeNull()
    expect(screen.queryByText("Return by")).toBeNull()
})
