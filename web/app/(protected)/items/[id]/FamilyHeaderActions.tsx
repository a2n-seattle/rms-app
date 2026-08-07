"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { EditFamilyModal } from "./EditFamilyModal"
import { AddSubItemModal } from "./AddSubItemModal"
import type { ActionState } from "@/lib/actionState"
import type { MainSchema } from "@/lib/api/types"
import styles from "./resource-detail.module.css"

interface FamilyHeaderActionsProps {
    main: MainSchema
    itemCount: number
    updateFamilyAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
    deleteFamilyAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
    addSubItemAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
}

export function FamilyHeaderActions({ main, itemCount, updateFamilyAction, deleteFamilyAction, addSubItemAction }: FamilyHeaderActionsProps) {
    const [editOpen, setEditOpen] = useState(false)
    const [addOpen, setAddOpen] = useState(false)

    return (
        <div className={styles.headerActions}>
            <Button type="button" variant="secondary" aria-label="Edit item" onClick={() => setEditOpen(true)}>
                Edit
            </Button>
            <Button type="button" variant="secondary" onClick={() => setAddOpen(true)}>
                Add sub-item
            </Button>
            <EditFamilyModal
                open={editOpen}
                onClose={() => setEditOpen(false)}
                main={main}
                itemCount={itemCount}
                updateFamilyAction={updateFamilyAction}
                deleteFamilyAction={deleteFamilyAction}
            />
            <AddSubItemModal open={addOpen} onClose={() => setAddOpen(false)} addSubItemAction={addSubItemAction} />
        </div>
    )
}
