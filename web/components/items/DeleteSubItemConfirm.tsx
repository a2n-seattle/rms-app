"use client"

import { useActionState, useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { Alert } from "@/components/ui/Alert"
import { ActionState, initialActionState } from "@/lib/actionState"
import styles from "./EditSubItemModal.module.css"

interface DeleteSubItemConfirmProps {
    itemId: string
    action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
    onClose: () => void
    onCancel: () => void
}

export function DeleteSubItemConfirm({ itemId, action, onClose, onCancel }: DeleteSubItemConfirmProps) {
    const [state, formAction] = useActionState(action, initialActionState)

    // Only reached when deleteSubItemAction didn't redirect -- i.e. this wasn't the family's
    // last item, so the page just revalidates in place instead of navigating away.
    useEffect(() => {
        if (state.success) {
            onClose()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state])

    return (
        <form action={formAction} className={styles.form}>
            <input type="hidden" name="id" value={itemId} />
            <p className={styles.warning}>This can&apos;t be undone.</p>
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
