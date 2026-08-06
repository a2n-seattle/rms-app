"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/Modal"
import { EditFamilyForm } from "./EditFamilyForm"
import { DeleteFamilyConfirm } from "./DeleteFamilyConfirm"
import type { ActionState } from "@/lib/actionState"
import type { MainSchema } from "@/lib/api/types"

interface EditFamilyModalProps {
    open: boolean
    onClose: () => void
    main: MainSchema
    itemCount: number
    updateFamilyAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
    deleteFamilyAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
}

export function EditFamilyModal({ open, onClose, main, itemCount, updateFamilyAction, deleteFamilyAction }: EditFamilyModalProps) {
    const [mode, setMode] = useState<"edit" | "confirm-delete">("edit")

    function handleClose() {
        setMode("edit")
        onClose()
    }

    return (
        <Modal open={open} onClose={handleClose} title={mode === "edit" ? "Edit item" : "Delete item?"}>
            {mode === "edit" ? (
                <EditFamilyForm main={main} action={updateFamilyAction} onClose={handleClose} onRequestDelete={() => setMode("confirm-delete")} />
            ) : (
                <DeleteFamilyConfirm familyId={main.id} itemCount={itemCount} action={deleteFamilyAction} onCancel={() => setMode("edit")} />
            )}
        </Modal>
    )
}
