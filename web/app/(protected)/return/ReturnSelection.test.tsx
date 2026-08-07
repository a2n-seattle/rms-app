import { render, screen, fireEvent } from "@testing-library/react"
import { ReturnSelection } from "./ReturnSelection"
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

test("defaults to all borrowed items selected", () => {
    render(<ReturnSelection items={[ITEM_1, ITEM_2]} returnAction={jest.fn()} />)

    expect(screen.getByRole("button", { name: "Confirm Return (2)" }).hasAttribute("disabled")).toBe(false)
})

test("allows deselecting an individual item from the return", () => {
    render(<ReturnSelection items={[ITEM_1, ITEM_2]} returnAction={jest.fn()} />)

    fireEvent.click(screen.getByLabelText("Select Chair 1"))

    expect(screen.getByRole("button", { name: "Confirm Return (1)" })).not.toBeNull()
})

test("allows entering a per-item condition note", () => {
    render(<ReturnSelection items={[ITEM_1, ITEM_2]} returnAction={jest.fn()} />)

    const conditionInput = screen.getByLabelText("Condition notes for Chair 1") as HTMLInputElement
    fireEvent.change(conditionInput, { target: { value: "cracked screen" } })

    expect(conditionInput.value).toEqual("cracked screen")
})

test("only pre-selects the ids passed via initialSelectedIds", () => {
    render(<ReturnSelection items={[ITEM_1, ITEM_2]} returnAction={jest.fn()} initialSelectedIds={["chair-1"]} />)

    expect(screen.getByRole("button", { name: "Confirm Return (1)" })).not.toBeNull()
})

describe("header select-all checkbox", () => {
    test("starts checked, not indeterminate, since all items are selected by default", () => {
        render(<ReturnSelection items={[ITEM_1, ITEM_2]} returnAction={jest.fn()} />)
        const header = screen.getByLabelText("Select all items") as HTMLInputElement
        expect(header.checked).toBe(true)
        expect(header.indeterminate).toBe(false)
    })

    test("becomes indeterminate when only some rows are checked", () => {
        render(<ReturnSelection items={[ITEM_1, ITEM_2]} returnAction={jest.fn()} />)
        fireEvent.click(screen.getByLabelText("Select Chair 1"))

        const header = screen.getByLabelText("Select all items") as HTMLInputElement
        expect(header.checked).toBe(false)
        expect(header.indeterminate).toBe(true)
    })

    test("clicking header when partial selects every row", () => {
        render(<ReturnSelection items={[ITEM_1, ITEM_2]} returnAction={jest.fn()} />)
        fireEvent.click(screen.getByLabelText("Select Chair 1"))

        fireEvent.click(screen.getByLabelText("Select all items"))

        expect(screen.getByRole("button", { name: "Confirm Return (2)" })).not.toBeNull()
    })

    test("clicking header when fully selected deselects every row", () => {
        render(<ReturnSelection items={[ITEM_1, ITEM_2]} returnAction={jest.fn()} />)

        fireEvent.click(screen.getByLabelText("Select all items"))

        expect(screen.getByRole("button", { name: "Confirm Return (0)" }).hasAttribute("disabled")).toBe(true)
    })
})
