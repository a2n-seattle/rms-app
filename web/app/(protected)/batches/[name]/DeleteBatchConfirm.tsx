"use client"

import { Button } from "@/components/ui/Button"
import { Alert } from "@/components/ui/Alert"
import { ActionState } from "@/lib/actionState"
import { useActionFormState } from "@/lib/useActionFormState"
import styles from "../BatchModal.module.css"

interface DeleteBatchConfirmProps {
    name: string
    action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
    onCancel: () => void
}

export function DeleteBatchConfirm({ name, action, onCancel }: DeleteBatchConfirmProps) {
    const [state, formAction] = useActionFormState(action)

    return (
        <form action={formAction} className={styles.form}>
            <input type="hidden" name="name" value={name} />
            <p className={styles.warning}>This will delete the batch &quot;{name}&quot; and cannot be undone.</p>
            {state.error && <Alert variant="error">{state.error}</Alert>}
            <div className={styles.actions}>
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" variant="danger">
                    Confirm delete
                </Button>
            </div>
        </form>
    )
}
