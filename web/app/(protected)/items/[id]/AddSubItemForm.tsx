"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { Alert } from "@/components/ui/Alert"
import { ActionState } from "@/lib/actionState"
import { useActionFormState } from "@/lib/useActionFormState"
import styles from "./EditFamilyModal.module.css"

interface AddSubItemFormProps {
    action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
    onClose: () => void
}

export function AddSubItemForm({ action, onClose }: AddSubItemFormProps) {
    const [state, formAction] = useActionFormState(action)

    useEffect(() => {
        if (state.success) {
            onClose()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state])

    return (
        <form action={formAction} className={styles.form}>
            <label className={styles.field}>
                Friendly name (optional)
                <input type="text" name="friendlyName" placeholder="Defaults to a numbered name" />
            </label>
            <label className={styles.field}>
                Notes (optional)
                <input type="text" name="notes" />
            </label>
            {state.error && <Alert variant="error">{state.error}</Alert>}
            <div className={styles.actions}>
                <Button type="submit">Add sub-item</Button>
            </div>
        </form>
    )
}
