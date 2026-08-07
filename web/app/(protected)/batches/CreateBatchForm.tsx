"use client"

import { useActionState, useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { Alert } from "@/components/ui/Alert"
import { ActionState, initialActionState } from "@/lib/actionState"
import styles from "./BatchModal.module.css"

interface CreateBatchFormProps {
    action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
    onClose: () => void
}

export function CreateBatchForm({ action, onClose }: CreateBatchFormProps) {
    const [state, formAction] = useActionState(action, initialActionState)

    useEffect(() => {
        if (state.success) {
            onClose()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state])

    return (
        <form action={formAction} className={styles.form}>
            <label className={styles.field}>
                Name
                <input type="text" name="name" required />
            </label>
            <label className={styles.field}>
                Item IDs (comma or space-separated)
                <input type="text" name="ids" required />
            </label>
            <label className={styles.field}>
                Groups (optional, comma or space-separated)
                <input type="text" name="groups" />
            </label>
            {state.error && <Alert variant="error">{state.error}</Alert>}
            <div className={styles.actions}>
                <Button type="submit">Create batch</Button>
            </div>
        </form>
    )
}
