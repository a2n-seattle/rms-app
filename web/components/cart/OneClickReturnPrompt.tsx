"use client"

import { useActionState, useEffect } from "react"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { Alert } from "@/components/ui/Alert"
import { submitOneClickReturn } from "@/lib/actions/cart"
import { initialActionState } from "@/lib/actionState"
import styles from "./OneClickPrompt.module.css"

interface OneClickReturnPromptProps {
    open: boolean
    onClose: () => void
    ids: string[]
    familyName: string
}

/**
 * One-click Return from the browse table -- for the "forgot I had this
 * borrowed" scenario. `ids` are the current user's own borrowed sub-items
 * in this family, already known from the browse page's data (no fresh
 * fetch needed, unlike OneClickPrompt's Borrow/Reserve availability
 * resolve). Kept as its own component/action rather than folded into
 * OneClickPrompt -- no time fields, just notes.
 */
export function OneClickReturnPrompt({ open, onClose, ids, familyName }: OneClickReturnPromptProps) {
    const [state, formAction] = useActionState(submitOneClickReturn, initialActionState)

    useEffect(() => {
        if (state.success) {
            onClose()
        }
        // Only re-run when a fresh success arrives -- onClose intentionally excluded
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state])

    return (
        <Modal open={open} onClose={onClose} title={`Return ${familyName}`}>
            <form action={formAction}>
                {ids.map((id) => (
                    <input key={id} type="hidden" name="ids" value={id} />
                ))}
                <label className={styles.field}>
                    Notes
                    <input type="text" name="notes" />
                </label>

                {state.error && <Alert variant="error">{state.error}</Alert>}

                <Button type="submit" variant="secondary">
                    Return {ids.length} item{ids.length === 1 ? "" : "s"}
                </Button>
            </form>
        </Modal>
    )
}
