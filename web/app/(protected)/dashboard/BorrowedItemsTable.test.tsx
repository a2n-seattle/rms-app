import { render, screen, fireEvent } from "@testing-library/react"
import { BorrowedItemsTable } from "./BorrowedItemsTable"
import type { ItemsSchema } from "@/lib/api/types"

const ITEM_1: ItemsSchema = {
    id: "chair-1",
    familyId: "chairs",
    name: "Chair 1",
    borrower: "a@b.com",
    borrowTime: 1000000000010,
    returnTime: 0,
    history: [],
    schedule: [],
    notes: "",
}

const ITEM_2: ItemsSchema = {
    id: "chair-2",
    familyId: "chairs",
    name: "Chair 2",
    borrower: "a@b.com",
    borrowTime: 1000000000010,
    returnTime: 0,
    history: [],
    schedule: [],
    notes: "",
}

test("Return Selected starts disabled with none selected", () => {
    render(<BorrowedItemsTable items={[ITEM_1, ITEM_2]} />)

    const link = screen.getByText("Return Selected (0)")
    expect(link.getAttribute("aria-disabled")).toBe("true")
    expect(link.hasAttribute("href")).toBe(false)
})

test("selecting a row enables Return Selected and builds the /return?ids= link", () => {
    render(<BorrowedItemsTable items={[ITEM_1, ITEM_2]} />)

    fireEvent.click(screen.getByLabelText("Select Chair 1"))

    const link = screen.getByRole("link", { name: "Return Selected (1)" })
    expect(link.getAttribute("aria-disabled")).toBe("false")
    expect(link.getAttribute("href")).toBe("/return?ids=chair-1")
})

describe("header select-all checkbox", () => {
    test("starts unchecked, not indeterminate", () => {
        render(<BorrowedItemsTable items={[ITEM_1, ITEM_2]} />)
        const header = screen.getByLabelText("Select all currently borrowed items") as HTMLInputElement
        expect(header.checked).toBe(false)
        expect(header.indeterminate).toBe(false)
    })

    test("becomes indeterminate when only some rows are checked", () => {
        render(<BorrowedItemsTable items={[ITEM_1, ITEM_2]} />)
        fireEvent.click(screen.getByLabelText("Select Chair 1"))

        const header = screen.getByLabelText("Select all currently borrowed items") as HTMLInputElement
        expect(header.checked).toBe(false)
        expect(header.indeterminate).toBe(true)
    })

    test("clicking header checks every row, clicking again clears them all", () => {
        render(<BorrowedItemsTable items={[ITEM_1, ITEM_2]} />)

        fireEvent.click(screen.getByLabelText("Select all currently borrowed items"))
        expect(screen.getByRole("link", { name: "Return Selected (2)" })).not.toBeNull()

        fireEvent.click(screen.getByLabelText("Select all currently borrowed items"))
        expect(screen.getByText("Return Selected (0)")).not.toBeNull()
    })
})
