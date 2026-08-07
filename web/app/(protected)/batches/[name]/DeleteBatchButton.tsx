"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { DeleteBatchConfirm } from "./DeleteBatchConfirm"
import type { ActionState } from "@/lib/actionState"

interface DeleteBatchButtonProps {
    name: string
    deleteBatchAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
}

export function DeleteBatchButton({ name, deleteBatchAction }: DeleteBatchButtonProps) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button type="button" variant="danger" onClick={() => setOpen(true)}>
                Delete batch
            </Button>
            <Modal open={open} onClose={() => setOpen(false)} title="Delete batch?">
                <DeleteBatchConfirm name={name} action={deleteBatchAction} onCancel={() => setOpen(false)} />
            </Modal>
        </>
    )
}
