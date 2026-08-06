"use client"

import { useActionState, useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { Alert } from "@/components/ui/Alert"
import { ActionState, initialActionState } from "@/lib/actionState"
import type { ItemsSchema } from "@/lib/api/types"
import styles from "./EditSubItemModal.module.css"

interface EditSubItemFormProps {
    item: ItemsSchema
    action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
    onClose: () => void
    onRequestDelete: () => void
}

export function EditSubItemForm({ item, action, onClose, onRequestDelete }: EditSubItemFormProps) {
    const [state, formAction] = useActionState(action, initialActionState)

    useEffect(() => {
        if (state.success) {
            onClose()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state])

    return (
        <form action={formAction} className={styles.form}>
            <input type="hidden" name="id" value={item.id} />
            <label className={styles.field}>
                Friendly name
                <input type="text" name="name" defaultValue={item.name} required />
            </label>
            <label className={styles.field}>
                Notes
                <input type="text" name="notes" defaultValue={item.notes} />
            </label>
            {state.error && <Alert variant="error">{state.error}</Alert>}
            <div className={styles.actions}>
                <Button type="button" variant="danger" onClick={onRequestDelete}>
                    Delete sub-item
                </Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    )
}
