"use client"

import { Button } from "@/components/ui/Button"
import { Alert } from "@/components/ui/Alert"
import { ActionState } from "@/lib/actionState"
import { useActionFormState } from "@/lib/useActionFormState"
import styles from "./EditFamilyModal.module.css"

interface DeleteFamilyConfirmProps {
    familyId: string
    itemCount: number
    action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
    onCancel: () => void
}

export function DeleteFamilyConfirm({ familyId, itemCount, action, onCancel }: DeleteFamilyConfirmProps) {
    const [state, formAction] = useActionFormState(action)

    return (
        <form action={formAction} className={styles.form}>
            <input type="hidden" name="id" value={familyId} />
            <p className={styles.warning}>
                This will delete {itemCount} sub-item{itemCount === 1 ? "" : "s"} and cannot be undone.
            </p>
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
