"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { EditSubItemModal } from "@/components/items/EditSubItemModal"
import type { ActionState } from "@/lib/actionState"
import type { ItemsSchema } from "@/lib/api/types"

interface SubItemHeaderActionsProps {
    item: ItemsSchema
    updateSubItemAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
    deleteSubItemAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
}

export function SubItemHeaderActions({ item, updateSubItemAction, deleteSubItemAction }: SubItemHeaderActionsProps) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button type="button" variant="secondary" aria-label="Edit sub-item" onClick={() => setOpen(true)}>
                Edit
            </Button>
            <EditSubItemModal
                open={open}
                onClose={() => setOpen(false)}
                item={item}
                updateSubItemAction={updateSubItemAction}
                deleteSubItemAction={deleteSubItemAction}
            />
        </>
    )
}
