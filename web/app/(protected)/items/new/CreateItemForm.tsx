"use client"

import { Button } from "@/components/ui/Button"
import { ActionForm } from "@/components/ui/ActionForm"
import type { ActionState } from "@/lib/actionState"
import styles from "./new-item.module.css"

interface CreateItemFormProps {
    action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
}

export function CreateItemForm({ action }: CreateItemFormProps) {
    return (
        <ActionForm action={action} successMessage="Item created successfully." className={styles.form}>
            <label className={styles.field}>
                Name
                <input type="text" name="name" required />
            </label>
            <label className={styles.field}>
                Description
                <input type="text" name="description" />
            </label>
            <label className={styles.field}>
                Location
                <input type="text" name="location" />
            </label>
            <label className={styles.field}>
                Tags (comma-separated)
                <input type="text" name="tags" />
            </label>
            <label className={styles.field}>
                First sub-item friendly name (optional)
                <input type="text" name="friendlyName" placeholder="Defaults to a numbered name" />
            </label>
            <label className={styles.field}>
                First sub-item notes (optional)
                <input type="text" name="notes" />
            </label>
            <Button type="submit">Create item</Button>
        </ActionForm>
    )
}
