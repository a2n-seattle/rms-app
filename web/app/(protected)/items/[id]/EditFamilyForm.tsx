"use client"

import { useActionState, useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { Alert } from "@/components/ui/Alert"
import { ActionState, initialActionState } from "@/lib/actionState"
import type { MainSchema } from "@/lib/api/types"
import styles from "./EditFamilyModal.module.css"

interface EditFamilyFormProps {
    main: MainSchema
    action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
    onClose: () => void
    onRequestDelete: () => void
}

export function EditFamilyForm({ main, action, onClose, onRequestDelete }: EditFamilyFormProps) {
    const [state, formAction] = useActionState(action, initialActionState)

    useEffect(() => {
        if (state.success) {
            onClose()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state])

    return (
        <form action={formAction} className={styles.form}>
            <input type="hidden" name="id" value={main.id} />
            <label className={styles.field}>
                Name
                <input type="text" name="name" defaultValue={main.name} required />
            </label>
            <label className={styles.field}>
                Description
                <input type="text" name="description" defaultValue={main.description} />
            </label>
            <label className={styles.field}>
                Location
                <input type="text" name="location" defaultValue={main.location} />
            </label>
            <label className={styles.field}>
                Tags (comma-separated)
                <input type="text" name="tags" defaultValue={main.tags.join(", ")} />
            </label>
            {state.error && <Alert variant="error">{state.error}</Alert>}
            <div className={styles.actions}>
                <Button type="button" variant="danger" onClick={onRequestDelete}>
                    Delete item
                </Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    )
}
