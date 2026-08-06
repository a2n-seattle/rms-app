import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { EditSubItemModal } from "./EditSubItemModal"
import type { ActionState } from "@/lib/actionState"
import type { ItemsSchema } from "@/lib/api/types"

const ITEM: ItemsSchema = {
    id: "chair-1",
    familyId: "chairs",
    name: "Chair 1",
    borrower: "",
    borrowTime: 0,
    returnTime: 0,
    history: [],
    schedule: [],
    notes: "some notes",
}

const noopAction = jest.fn(async (_prevState: ActionState, _formData: FormData): Promise<ActionState> => ({ success: true }))

function renderModal(props: Partial<React.ComponentProps<typeof EditSubItemModal>> = {}) {
    const onClose = jest.fn()
    const utils = render(
        <EditSubItemModal
            open={true}
            onClose={onClose}
            item={ITEM}
            updateSubItemAction={noopAction}
            deleteSubItemAction={noopAction}
            {...props}
        />
    )
    return { onClose, ...utils }
}

test("pre-fills fields from the item", () => {
    renderModal()

    expect(screen.getByDisplayValue("Chair 1")).not.toBeNull()
    expect(screen.getByDisplayValue("some notes")).not.toBeNull()
})

test("closes on a successful update", async () => {
    const { onClose } = renderModal()

    fireEvent.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
})

test("Delete sub-item switches to the delete confirmation, which can be cancelled back to edit", () => {
    renderModal()

    fireEvent.click(screen.getByRole("button", { name: "Delete sub-item" }))

    expect(screen.getByText("This can't be undone.")).not.toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(screen.getByRole("button", { name: "Save" })).not.toBeNull()
})
