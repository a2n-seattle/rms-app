jest.mock("@/lib/actions/cart", () => ({
    resolveFamilyAvailability: jest.fn(),
    submitBorrowOrReserve: jest.fn(),
    submitOneClickReturn: jest.fn(),
}))

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { CartProvider, useCart } from "@/lib/cart/CartContext"
import { resolveFamilyAvailability } from "@/lib/actions/cart"
import { ResourcesTable } from "./ResourcesTable"
import type { MainSchema } from "@/lib/api/types"

const mockResolve = resolveFamilyAvailability as jest.Mock

const CHAIRS: MainSchema = {
    id: "chairs",
    nameKey: "chairs",
    name: "Chairs",
    description: "",
    owner: "facilities",
    location: "Room A",
    batch: [],
    tags: ["furniture"],
    items: ["chair-1", "chair-2"],
}

const PROJECTORS: MainSchema = {
    id: "projectors",
    nameKey: "projectors",
    name: "Projectors",
    description: "",
    owner: "av-team",
    location: "Room B",
    batch: [],
    tags: ["electronics"],
    items: ["proj-1"],
}

const CONFERENCE_ROOM: MainSchema = {
    id: "conference-room",
    nameKey: "conference-room",
    name: "Conference Room",
    description: "",
    owner: "facilities",
    location: "Floor 2",
    batch: [],
    tags: [],
    items: ["conference-room"],
    type: "room",
}

function renderTable(props: Partial<React.ComponentProps<typeof ResourcesTable>> = {}) {
    return render(
        <CartProvider>
            <ResourcesTable items={[CHAIRS, PROJECTORS]} myBorrowedByFamily={{}} {...props} />
        </CartProvider>
    )
}

beforeEach(() => {
    mockResolve.mockReset()
})

test("shows all resources with no filter", () => {
    renderTable()

    expect(screen.getByText("Chairs")).not.toBeNull()
    expect(screen.getByText("Projectors")).not.toBeNull()
})

test("filters by name", () => {
    renderTable()

    fireEvent.change(screen.getByLabelText("Filter resources"), { target: { value: "chair" } })

    expect(screen.getByText("Chairs")).not.toBeNull()
    expect(screen.queryByText("Projectors")).toBeNull()
})

test("filters by tag", () => {
    renderTable()

    fireEvent.change(screen.getByLabelText("Filter resources"), { target: { value: "electronics" } })

    expect(screen.getByText("Projectors")).not.toBeNull()
    expect(screen.queryByText("Chairs")).toBeNull()
})

test("shows empty state when nothing matches", () => {
    renderTable()

    fireEvent.change(screen.getByLabelText("Filter resources"), { target: { value: "nonexistent" } })

    expect(screen.getByText("No resources match.")).not.toBeNull()
})

test("shows a Room badge for room-type resources only", () => {
    renderTable({ items: [CHAIRS, CONFERENCE_ROOM] })

    expect(screen.getByText("Room")).not.toBeNull()
})

test("checking a row's checkbox resolves availability and adds available items to the cart", async () => {
    mockResolve.mockResolvedValue({ items: [{ id: "chair-1", name: "Chair 1" }, { id: "chair-2", name: "Chair 2" }], total: 2 })
    let cartCount = -1
    function CartReader() {
        cartCount = useCart().count
        return null
    }
    render(
        <CartProvider>
            <CartReader />
            <ResourcesTable items={[CHAIRS]} myBorrowedByFamily={{}} />
        </CartProvider>
    )

    fireEvent.click(screen.getByLabelText("Add Chairs to cart"))

    await waitFor(() => expect(cartCount).toBe(2))
    expect(mockResolve).toHaveBeenCalledWith("chairs")
})

test("flags partial availability when fewer items resolve than the family total", async () => {
    mockResolve.mockResolvedValue({ items: [{ id: "chair-1", name: "Chair 1" }], total: 2 })
    renderTable({ items: [CHAIRS] })

    fireEvent.click(screen.getByLabelText("Add Chairs to cart"))

    await waitFor(() => {
        expect(screen.getByText("1 of 2 added — 1 currently borrowed")).not.toBeNull()
    })
})

test("unchecking a row removes its items from the cart", async () => {
    mockResolve.mockResolvedValue({ items: [{ id: "chair-1", name: "Chair 1" }], total: 1 })
    let cartCount = -1
    function CartReader() {
        cartCount = useCart().count
        return null
    }
    render(
        <CartProvider>
            <CartReader />
            <ResourcesTable items={[CHAIRS]} myBorrowedByFamily={{}} />
        </CartProvider>
    )

    fireEvent.click(screen.getByLabelText("Add Chairs to cart"))
    await waitFor(() => expect(cartCount).toBe(1))

    fireEvent.click(screen.getByLabelText("Add Chairs to cart"))
    await waitFor(() => expect(cartCount).toBe(0))
})

test("Return action is hidden by default and shown when the user has borrowed items from that family", () => {
    renderTable({ items: [CHAIRS], myBorrowedByFamily: {} })
    expect(screen.queryByLabelText("Return Chairs")).toBeNull()
})

test("shows the Return action when myBorrowedByFamily has entries for that family", () => {
    renderTable({ items: [CHAIRS], myBorrowedByFamily: { chairs: [{ id: "chair-1", name: "Chair 1" }] } })
    expect(screen.getByLabelText("Return Chairs")).not.toBeNull()
})

test("clicking one-click Borrow opens the Borrow prompt for that family", () => {
    mockResolve.mockReturnValue(new Promise(() => {}))
    renderTable({ items: [CHAIRS] })

    fireEvent.click(screen.getByLabelText("Borrow Chairs"))

    expect(screen.getByRole("dialog", { name: "Borrow Chairs" })).not.toBeNull()
})

test("clicking one-click Reserve opens the Reserve prompt for that family", () => {
    mockResolve.mockReturnValue(new Promise(() => {}))
    renderTable({ items: [CHAIRS] })

    fireEvent.click(screen.getByLabelText("Reserve Chairs"))

    expect(screen.getByRole("dialog", { name: "Reserve Chairs" })).not.toBeNull()
})

test("clicking one-click Return opens the Return prompt for that family", () => {
    renderTable({ items: [CHAIRS], myBorrowedByFamily: { chairs: [{ id: "chair-1", name: "Chair 1" }] } })

    fireEvent.click(screen.getByLabelText("Return Chairs"))

    expect(screen.getByRole("dialog", { name: "Return Chairs" })).not.toBeNull()
})

describe("header select-all checkbox", () => {
    test("starts unchecked, not indeterminate", () => {
        renderTable()
        const header = screen.getByLabelText("Select all") as HTMLInputElement
        expect(header.checked).toBe(false)
        expect(header.indeterminate).toBe(false)
    })

    test("becomes indeterminate when only some rows are checked", async () => {
        mockResolve.mockResolvedValue({ items: [{ id: "chair-1", name: "Chair 1" }], total: 2 })
        renderTable()

        fireEvent.click(screen.getByLabelText("Add Chairs to cart"))

        await waitFor(() => {
            const header = screen.getByLabelText("Select all") as HTMLInputElement
            expect(header.indeterminate).toBe(true)
            expect(header.checked).toBe(false)
        })
    })

    test("becomes fully checked when every row is checked", async () => {
        mockResolve.mockResolvedValue({ items: [{ id: "chair-1", name: "Chair 1" }], total: 1 })
        renderTable()

        fireEvent.click(screen.getByLabelText("Add Chairs to cart"))
        fireEvent.click(screen.getByLabelText("Add Projectors to cart"))

        await waitFor(() => {
            const header = screen.getByLabelText("Select all") as HTMLInputElement
            expect(header.checked).toBe(true)
            expect(header.indeterminate).toBe(false)
        })
    })

    test("checking the header checks every filtered row and adds them all to the cart", async () => {
        mockResolve.mockImplementation((familyId: string) =>
            Promise.resolve({ items: [{ id: `${familyId}-item-1`, name: "Item 1" }], total: 1 })
        )
        let cartCount = -1
        function CartReader() {
            cartCount = useCart().count
            return null
        }
        render(
            <CartProvider>
                <CartReader />
                <ResourcesTable items={[CHAIRS, PROJECTORS]} myBorrowedByFamily={{}} />
            </CartProvider>
        )

        fireEvent.click(screen.getByLabelText("Select all"))

        await waitFor(() => expect(cartCount).toBe(2))
        expect(mockResolve).toHaveBeenCalledWith("chairs")
        expect(mockResolve).toHaveBeenCalledWith("projectors")
    })
})
