import { render, screen, fireEvent } from "@testing-library/react"
import { CartProvider, useCart } from "@/lib/cart/CartContext"
import { ResourceBasket } from "./ResourceBasket"
import type { ItemsSchema } from "@/lib/api/types"

const ITEM_1: ItemsSchema = {
    id: "chair-1",
    familyId: "chairs",
    name: "Chair 1",
    borrower: "",
    borrowTime: 0,
    returnTime: 0,
    history: [],
    schedule: [],
    notes: "",
}

const ITEM_2: ItemsSchema = {
    id: "chair-2",
    familyId: "chairs",
    name: "Chair 2",
    borrower: "",
    borrowTime: 0,
    returnTime: 0,
    history: [],
    schedule: [],
    notes: "",
}

function CartReader({ onCart }: { onCart: (entries: ReturnType<typeof useCart>["entries"]) => void }) {
    onCart(useCart().entries)
    return null
}

function renderBasket(props: Partial<React.ComponentProps<typeof ResourceBasket>> = {}, onCart?: (entries: ReturnType<typeof useCart>["entries"]) => void) {
    return render(
        <CartProvider>
            {onCart && <CartReader onCart={onCart} />}
            <ResourceBasket
                familyId="chairs"
                familyName="Chairs"
                items={[ITEM_1, ITEM_2]}
                borrowAction={jest.fn()}
                reserveAction={jest.fn()}
                {...props}
            />
        </CartProvider>
    )
}

test("defaults to all sub-items selected", () => {
    renderBasket()

    expect(screen.getByText("2 of 2 selected")).not.toBeNull()
    expect(screen.getByRole("button", { name: "Borrow Selected (2)" }).hasAttribute("disabled")).toBe(false)
})

test("allows deselecting an individual sub-item", () => {
    renderBasket()

    fireEvent.click(screen.getAllByRole("checkbox")[0])

    expect(screen.getByText("1 of 2 selected")).not.toBeNull()
})

test("Select none clears the selection and disables the submit buttons", () => {
    renderBasket()

    fireEvent.click(screen.getByText("Select none"))

    expect(screen.getByText("0 of 2 selected")).not.toBeNull()
    expect(screen.getByRole("button", { name: "Borrow Selected (0)" }).hasAttribute("disabled")).toBe(true)
    expect(screen.getByRole("button", { name: "Reserve Selected (0)" }).hasAttribute("disabled")).toBe(true)
})

test("Select all restores the full selection after Select none", () => {
    renderBasket()

    fireEvent.click(screen.getByText("Select none"))
    fireEvent.click(screen.getByText("Select all"))

    expect(screen.getByText("2 of 2 selected")).not.toBeNull()
})

test("hides Borrow Selected and the Borrower column for a room", () => {
    renderBasket({ familyId: "conference-room", isRoom: true })

    expect(screen.queryByRole("button", { name: /Borrow Selected/ })).toBeNull()
    expect(screen.queryByText("Borrower")).toBeNull()
    expect(screen.getByRole("button", { name: "Reserve Selected (2)" })).not.toBeNull()
})

test("Add selected to cart adds every selected, available sub-item", () => {
    let cartEntries: ReturnType<typeof useCart>["entries"] = []
    renderBasket({}, (entries) => (cartEntries = entries))

    fireEvent.click(screen.getByRole("button", { name: "Add selected to cart" }))

    expect(cartEntries).toEqual([
        { itemId: "chair-1", familyId: "chairs", itemName: "Chair 1", familyName: "Chairs" },
        { itemId: "chair-2", familyId: "chairs", itemName: "Chair 2", familyName: "Chairs" },
    ])
    expect(screen.queryByText(/skipped/)).toBeNull()
})

test("Add selected to cart skips already-borrowed items and flags the count", () => {
    let cartEntries: ReturnType<typeof useCart>["entries"] = []
    const borrowedItem: ItemsSchema = { ...ITEM_2, borrower: "someone-else" }
    renderBasket({ items: [ITEM_1, borrowedItem] }, (entries) => (cartEntries = entries))

    fireEvent.click(screen.getByRole("button", { name: "Add selected to cart" }))

    expect(cartEntries.map((e) => e.itemId)).toEqual(["chair-1"])
    expect(screen.getByText("1 skipped — already borrowed")).not.toBeNull()
})

test("Add selected to cart is disabled with no selection", () => {
    renderBasket()

    fireEvent.click(screen.getByText("Select none"))

    expect(screen.getByRole("button", { name: "Add selected to cart" }).hasAttribute("disabled")).toBe(true)
})
