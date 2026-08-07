"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { ActionForm } from "@/components/ui/ActionForm"
import { getReserveDefaults, toLocalInputValue } from "@/lib/formDefaults"
import type { ActionState } from "@/lib/actionState"
import styles from "./item-detail.module.css"

interface ReserveFormProps {
    reserveAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
}

export function ReserveForm({ reserveAction }: ReserveFormProps) {
    const [defaults] = useState(getReserveDefaults)

    return (
        <ActionForm action={reserveAction} successMessage="Reservation created successfully." className={styles.form}>
            <label className={styles.field}>
                Start
                <input type="datetime-local" name="start" defaultValue={toLocalInputValue(defaults.start)} required />
            </label>
            <label className={styles.field}>
                End
                <input type="datetime-local" name="end" defaultValue={toLocalInputValue(defaults.end)} required />
            </label>
            <label className={styles.field}>
                Notes
                <input type="text" name="notes" />
            </label>
            <Button type="submit">Reserve</Button>
        </ActionForm>
    )
}
