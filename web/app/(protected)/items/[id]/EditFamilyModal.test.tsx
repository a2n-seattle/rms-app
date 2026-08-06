import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { EditFamilyModal } from "./EditFamilyModal"
import type { ActionState } from "@/lib/actionState"
import type { MainSchema } from "@/lib/api/types"

const MAIN: MainSchema = {
    id: "chairs",
    nameKey: "chairs",
    name: "Chairs",
    description: "Stackable chairs",
    owner: "facilities",
    location: "Room A",
    batch: [],
    tags: ["furniture"],
    items: ["chair-1", "chair-2"],
}

const noopAction = jest.fn(async (_prevState: ActionState, _formData: FormData): Promise<ActionState> => ({ success: true }))

function renderModal(props: Partial<React.ComponentProps<typeof EditFamilyModal>> = {}) {
    const onClose = jest.fn()
    const utils = render(
        <EditFamilyModal
            open={true}
            onClose={onClose}
            main={MAIN}
            itemCount={2}
            updateFamilyAction={noopAction}
            deleteFamilyAction={noopAction}
            {...props}
        />
    )
    return { onClose, ...utils }
}

test("pre-fills fields from main", () => {
    renderModal()

    expect(screen.getByDisplayValue("Chairs")).not.toBeNull()
    expect(screen.getByDisplayValue("Stackable chairs")).not.toBeNull()
    expect(screen.getByDisplayValue("Room A")).not.toBeNull()
    expect(screen.getByDisplayValue("furniture")).not.toBeNull()
})

test("closes on a successful update", async () => {
    const { onClose } = renderModal()

    fireEvent.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
})

test("Delete item switches to the delete confirmation, which can be cancelled back to edit", () => {
    renderModal()

    fireEvent.click(screen.getByRole("button", { name: "Delete item" }))

    expect(screen.getByText(/This will delete 2 sub-items/)).not.toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(screen.getByRole("button", { name: "Save" })).not.toBeNull()
})
