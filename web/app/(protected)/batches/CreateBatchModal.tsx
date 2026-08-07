"use client"

import { Modal } from "@/components/ui/Modal"
import { CreateBatchForm } from "./CreateBatchForm"
import type { ActionState } from "@/lib/actionState"

interface CreateBatchModalProps {
    open: boolean
    onClose: () => void
    createBatchAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
}

export function CreateBatchModal({ open, onClose, createBatchAction }: CreateBatchModalProps) {
    return (
        <Modal open={open} onClose={onClose} title="Create batch">
            <CreateBatchForm action={createBatchAction} onClose={onClose} />
        </Modal>
    )
}
