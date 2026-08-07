import { render, screen, fireEvent } from "@testing-library/react"
import { CartProvider, useCart } from "@/lib/cart/CartContext"
import { ResourceBasket } from "./ResourceBasket"
import type { ActionState } from "@/lib/actionState"
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

const noopAction = jest.fn(async (_prevState: ActionState, _formData: FormData): Promise<ActionState> => ({ success: true }))

function CartReader({ onCart }: { onCart: (entries: ReturnType<typeof useCart>["entries"]) => void }) {
    onCart(useCart().entries)
    return null
}

function renderBasket(
    props: Partial<React.ComponentProps<typeof ResourceBasket>> = {},
    onCart?: (entries: ReturnType<typeof useCart>["entries"]) => void
) {
    return render(
        <CartProvider>
            {onCart && <CartReader onCart={onCart} />}
            <ResourceBasket
                familyId="chairs"
                familyName="Chairs"
                items={[ITEM_1, ITEM_2]}
                borrowAction={noopAction}
                reserveAction={noopAction}
                updateSubItemAction={noopAction}
                deleteSubItemAction={noopAction}
                {...props}
            />
        </CartProvider>
    )
}

test("defaults to all sub-items selected", () => {
    renderBasket()

    expect(screen.getByRole("button", { name: "Borrow Selected (2)" }).hasAttribute("disabled")).toBe(false)
})

test("allows deselecting an individual sub-item", () => {
    renderBasket()

    fireEvent.click(screen.getByLabelText("Select Chair 1"))

    expect(screen.getByRole("button", { name: "Borrow Selected (1)" })).not.toBeNull()
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

    fireEvent.click(screen.getByLabelText("Select all sub-items"))

    expect(screen.getByRole("button", { name: "Add selected to cart" }).hasAttribute("disabled")).toBe(true)
})

test("clicking a row's Edit button opens the edit modal for that sub-item", () => {
    renderBasket()

    fireEvent.click(screen.getByLabelText("Edit Chair 1"))

    expect(screen.getByRole("dialog", { name: "Edit sub-item" })).not.toBeNull()
    expect(screen.getByDisplayValue("Chair 1")).not.toBeNull()
})

test("closing the edit modal removes it", () => {
    renderBasket()

    fireEvent.click(screen.getByLabelText("Edit Chair 1"))
    fireEvent.click(screen.getByRole("button", { name: "Close" }))

    expect(screen.queryByRole("dialog")).toBeNull()
})

describe("time field defaults", () => {
    const FIXED_NOW = new Date("2026-03-01T12:00:00.000Z").getTime()

    beforeEach(() => {
        jest.spyOn(Date, "now").mockReturnValue(FIXED_NOW)
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    test("Return by defaults to 24h from now", () => {
        renderBasket()

        const returnBy = screen.getByLabelText("Return by") as HTMLInputElement
        expect(new Date(returnBy.value).getTime()).toEqual(FIXED_NOW + 24 * 60 * 60 * 1000)
    })

    test("reserve Start defaults to now and End to start + 24h", () => {
        renderBasket()

        const start = screen.getByLabelText("Start") as HTMLInputElement
        const end = screen.getByLabelText("End") as HTMLInputElement
        expect(new Date(start.value).getTime()).toEqual(FIXED_NOW)
        expect(new Date(end.value).getTime()).toEqual(FIXED_NOW + 24 * 60 * 60 * 1000)
    })
})

describe("header select-all checkbox", () => {
    test("starts checked, not indeterminate, since all sub-items are selected by default", () => {
        renderBasket()
        const header = screen.getByLabelText("Select all sub-items") as HTMLInputElement
        expect(header.checked).toBe(true)
        expect(header.indeterminate).toBe(false)
    })

    test("becomes indeterminate when only some rows are checked", () => {
        renderBasket()
        fireEvent.click(screen.getByLabelText("Select Chair 1"))

        const header = screen.getByLabelText("Select all sub-items") as HTMLInputElement
        expect(header.checked).toBe(false)
        expect(header.indeterminate).toBe(true)
    })

    test("clicking header when partial selects every row", () => {
        renderBasket()
        fireEvent.click(screen.getByLabelText("Select Chair 1"))

        fireEvent.click(screen.getByLabelText("Select all sub-items"))

        expect(screen.getByRole("button", { name: "Borrow Selected (2)" })).not.toBeNull()
    })

    test("clicking header when fully selected deselects every row", () => {
        renderBasket()

        fireEvent.click(screen.getByLabelText("Select all sub-items"))

        expect(screen.getByRole("button", { name: "Borrow Selected (0)" }).hasAttribute("disabled")).toBe(true)
    })
})
