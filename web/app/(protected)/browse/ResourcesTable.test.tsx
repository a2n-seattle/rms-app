import { render, screen, fireEvent } from "@testing-library/react"
import { ResourcesTable } from "./ResourcesTable"
import type { MainSchema } from "@/lib/api/types"

const CHAIRS: MainSchema = {
    id: "chairs",
    displayName: "Chairs",
    description: "",
    owner: "facilities",
    location: "Room A",
    batch: [],
    tags: ["furniture"],
    items: ["chair-1", "chair-2"],
}

const PROJECTORS: MainSchema = {
    id: "projectors",
    displayName: "Projectors",
    description: "",
    owner: "av-team",
    location: "Room B",
    batch: [],
    tags: ["electronics"],
    items: ["proj-1"],
}

test("shows all resources with no filter", () => {
    render(<ResourcesTable items={[CHAIRS, PROJECTORS]} />)

    expect(screen.getByText("Chairs")).not.toBeNull()
    expect(screen.getByText("Projectors")).not.toBeNull()
})

test("filters by name", () => {
    render(<ResourcesTable items={[CHAIRS, PROJECTORS]} />)

    fireEvent.change(screen.getByLabelText("Filter resources"), { target: { value: "chair" } })

    expect(screen.getByText("Chairs")).not.toBeNull()
    expect(screen.queryByText("Projectors")).toBeNull()
})

test("filters by tag", () => {
    render(<ResourcesTable items={[CHAIRS, PROJECTORS]} />)

    fireEvent.change(screen.getByLabelText("Filter resources"), { target: { value: "electronics" } })

    expect(screen.getByText("Projectors")).not.toBeNull()
    expect(screen.queryByText("Chairs")).toBeNull()
})

test("shows empty state when nothing matches", () => {
    render(<ResourcesTable items={[CHAIRS, PROJECTORS]} />)

    fireEvent.change(screen.getByLabelText("Filter resources"), { target: { value: "nonexistent" } })

    expect(screen.getByText("No resources match.")).not.toBeNull()
})
