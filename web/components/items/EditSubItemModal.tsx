"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/Modal"
import { EditSubItemForm } from "./EditSubItemForm"
import { DeleteSubItemConfirm } from "./DeleteSubItemConfirm"
import type { ActionState } from "@/lib/actionState"
import type { ItemsSchema } from "@/lib/api/types"

interface EditSubItemModalProps {
    open: boolean
    onClose: () => void
    item: ItemsSchema
    updateSubItemAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
    deleteSubItemAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
}

export function EditSubItemModal({ open, onClose, item, updateSubItemAction, deleteSubItemAction }: EditSubItemModalProps) {
    const [mode, setMode] = useState<"edit" | "confirm-delete">("edit")

    function handleClose() {
        setMode("edit")
        onClose()
    }

    return (
        <Modal open={open} onClose={handleClose} title={mode === "edit" ? "Edit sub-item" : "Delete sub-item?"}>
            {mode === "edit" ? (
                <EditSubItemForm item={item} action={updateSubItemAction} onClose={handleClose} onRequestDelete={() => setMode("confirm-delete")} />
            ) : (
                <DeleteSubItemConfirm itemId={item.id} action={deleteSubItemAction} onClose={handleClose} onCancel={() => setMode("edit")} />
            )}
        </Modal>
    )
}
