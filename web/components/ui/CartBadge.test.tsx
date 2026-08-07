jest.mock("@/components/cart/CartCheckoutModal", () => ({
    CartCheckoutModal: ({ open }: { open: boolean }) => (open ? <div data-testid="checkout-modal" /> : null),
}))

import { useEffect } from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { CartProvider, useCart, CartEntry } from "@/lib/cart/CartContext"
import { CartBadge } from "./CartBadge"

const CHAIR: CartEntry = { itemId: "chair-1", familyId: "chairs", itemName: "Chair 1", familyName: "Chairs" }

function Seeder({ seed }: { seed: CartEntry[] }) {
    const cart = useCart()
    useEffect(() => {
        if (seed.length > 0) {
            cart.addEntries(seed)
        }
        // seed once on mount only
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return null
}

test("renders nothing when the cart is empty", () => {
    const { container } = render(
        <CartProvider>
            <CartBadge />
        </CartProvider>
    )
    expect(container.innerHTML).toBe("")
})

test("shows the item count when the cart has entries", () => {
    render(
        <CartProvider>
            <Seeder seed={[CHAIR]} />
            <CartBadge />
        </CartProvider>
    )
    expect(screen.getByRole("button", { name: "Open cart (1 items)" })).not.toBeNull()
})

test("opens the checkout modal on click", () => {
    render(
        <CartProvider>
            <Seeder seed={[CHAIR]} />
            <CartBadge />
        </CartProvider>
    )

    expect(screen.queryByTestId("checkout-modal")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Open cart (1 items)" }))
    expect(screen.getByTestId("checkout-modal")).not.toBeNull()
})
