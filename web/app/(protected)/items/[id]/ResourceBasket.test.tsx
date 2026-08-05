import { render, screen, fireEvent } from "@testing-library/react"
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

test("defaults to all sub-items selected", () => {
    render(
        <ResourceBasket familyId="chairs" items={[ITEM_1, ITEM_2]} borrowAction={jest.fn()} reserveAction={jest.fn()} />
    )

    expect(screen.getByText("2 of 2 selected")).not.toBeNull()
    expect(screen.getByRole("button", { name: "Borrow Selected (2)" }).hasAttribute("disabled")).toBe(false)
})

test("allows deselecting an individual sub-item", () => {
    render(
        <ResourceBasket familyId="chairs" items={[ITEM_1, ITEM_2]} borrowAction={jest.fn()} reserveAction={jest.fn()} />
    )

    fireEvent.click(screen.getAllByRole("checkbox")[0])

    expect(screen.getByText("1 of 2 selected")).not.toBeNull()
})

test("Select none clears the selection and disables the submit buttons", () => {
    render(
        <ResourceBasket familyId="chairs" items={[ITEM_1, ITEM_2]} borrowAction={jest.fn()} reserveAction={jest.fn()} />
    )

    fireEvent.click(screen.getByText("Select none"))

    expect(screen.getByText("0 of 2 selected")).not.toBeNull()
    expect(screen.getByRole("button", { name: "Borrow Selected (0)" }).hasAttribute("disabled")).toBe(true)
    expect(screen.getByRole("button", { name: "Reserve Selected (0)" }).hasAttribute("disabled")).toBe(true)
})

test("Select all restores the full selection after Select none", () => {
    render(
        <ResourceBasket familyId="chairs" items={[ITEM_1, ITEM_2]} borrowAction={jest.fn()} reserveAction={jest.fn()} />
    )

    fireEvent.click(screen.getByText("Select none"))
    fireEvent.click(screen.getByText("Select all"))

    expect(screen.getByText("2 of 2 selected")).not.toBeNull()
})

test("hides Borrow Selected and the Borrower column for a room", () => {
    render(
        <ResourceBasket
            familyId="conference-room"
            items={[ITEM_1, ITEM_2]}
            isRoom
            borrowAction={jest.fn()}
            reserveAction={jest.fn()}
        />
    )

    expect(screen.queryByRole("button", { name: /Borrow Selected/ })).toBeNull()
    expect(screen.queryByText("Borrower")).toBeNull()
    expect(screen.getByRole("button", { name: "Reserve Selected (2)" })).not.toBeNull()
})
