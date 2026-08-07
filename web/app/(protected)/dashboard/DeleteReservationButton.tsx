"use client"

import { useActionState, useEffect, useState } from "react"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { Alert } from "@/components/ui/Alert"
import { ActionState, initialActionState } from "@/lib/actionState"
import styles from "./DeleteReservationButton.module.css"

interface DeleteReservationButtonProps {
    scheduleId: string
    action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
}

/**
 * Cancel/delete a reservation, gated behind a confirm step (GH-361) --
 * previously an immediate action with no confirmation. Generic on `action`
 * so the same component serves both the "Upcoming" alert banner and the
 * Scheduled tab table's delete column without duplicating the confirm-modal
 * logic.
 */
export function DeleteReservationButton({ scheduleId, action }: DeleteReservationButtonProps) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(true)}
                aria-label={`Cancel reservation ${scheduleId}`}
            >
                Cancel
            </Button>
            <Modal open={open} onClose={() => setOpen(false)} title="Cancel this reservation?">
                <ConfirmCancelForm scheduleId={scheduleId} action={action} onClose={() => setOpen(false)} />
            </Modal>
        </>
    )
}

interface ConfirmCancelFormProps {
    scheduleId: string
    action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
    onClose: () => void
}

/**
 * Split out from DeleteReservationButton so the completion effect below can
 * call `onClose` as a prop rather than a same-component setState wrapper --
 * same shape as GH-360's CartCheckoutModal/OneClickPrompt, which keeps
 * react-hooks/set-state-in-effect happy (it can't trace through a prop
 * boundary the way it can a locally-defined setter).
 */
function ConfirmCancelForm({ scheduleId, action, onClose }: ConfirmCancelFormProps) {
    const [state, formAction] = useActionState(action, initialActionState)

    useEffect(() => {
        if (state.success) {
            onClose()
        }
        // Only re-run when a fresh success arrives -- onClose intentionally excluded
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state])

    return (
        <form action={formAction}>
            <input type="hidden" name="scheduleId" value={scheduleId} />
            <p className={styles.warning}>This can&apos;t be undone.</p>
            {state.error && <Alert variant="error">{state.error}</Alert>}
            <div className={styles.actions}>
                <Button type="submit" variant="danger">
                    Confirm cancel
                </Button>
                <Button type="button" variant="secondary" onClick={onClose}>
                    Never mind
                </Button>
            </div>
        </form>
    )
}
