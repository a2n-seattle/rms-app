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

    expect(screen.getByText("2 of 2 selected")).not.toBeNull()
    expect(screen.getByRole("button", { name: "Confirm Return (2)" }).hasAttribute("disabled")).toBe(false)
})

test("allows deselecting an individual item from the return", () => {
    render(<ReturnSelection items={[ITEM_1, ITEM_2]} returnAction={jest.fn()} />)

    fireEvent.click(screen.getAllByRole("checkbox")[0])

    expect(screen.getByText("1 of 2 selected")).not.toBeNull()
})

test("Select none disables Confirm Return", () => {
    render(<ReturnSelection items={[ITEM_1, ITEM_2]} returnAction={jest.fn()} />)

    fireEvent.click(screen.getByText("Select none"))

    expect(screen.getByRole("button", { name: "Confirm Return (0)" }).hasAttribute("disabled")).toBe(true)
})

test("allows entering a per-item condition note", () => {
    render(<ReturnSelection items={[ITEM_1, ITEM_2]} returnAction={jest.fn()} />)

    const conditionInput = screen.getByLabelText("Condition notes for Chair 1") as HTMLInputElement
    fireEvent.change(conditionInput, { target: { value: "cracked screen" } })

    expect(conditionInput.value).toEqual("cracked screen")
})

test("only pre-selects the ids passed via initialSelectedIds", () => {
    render(<ReturnSelection items={[ITEM_1, ITEM_2]} returnAction={jest.fn()} initialSelectedIds={["chair-1"]} />)

    expect(screen.getByText("1 of 2 selected")).not.toBeNull()
})
