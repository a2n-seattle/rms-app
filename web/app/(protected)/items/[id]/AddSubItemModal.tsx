"use client"

import { Modal } from "@/components/ui/Modal"
import { AddSubItemForm } from "./AddSubItemForm"
import type { ActionState } from "@/lib/actionState"

interface AddSubItemModalProps {
    open: boolean
    onClose: () => void
    addSubItemAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
}

export function AddSubItemModal({ open, onClose, addSubItemAction }: AddSubItemModalProps) {
    return (
        <Modal open={open} onClose={onClose} title="Add sub-item">
            <AddSubItemForm action={addSubItemAction} onClose={onClose} />
        </Modal>
    )
}
