"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { CreateBatchModal } from "./CreateBatchModal"
import type { ActionState } from "@/lib/actionState"

interface CreateBatchButtonProps {
    createBatchAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
}

export function CreateBatchButton({ createBatchAction }: CreateBatchButtonProps) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button type="button" onClick={() => setOpen(true)}>
                Create batch
            </Button>
            <CreateBatchModal open={open} onClose={() => setOpen(false)} createBatchAction={createBatchAction} />
        </>
    )
}
