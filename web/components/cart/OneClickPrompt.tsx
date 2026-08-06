"use client"

import { useActionState, useEffect, useState } from "react"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { Alert } from "@/components/ui/Alert"
import { Badge } from "@/components/ui/Badge"
import { resolveFamilyAvailability, submitBorrowOrReserve, AvailableItem } from "@/lib/actions/cart"
import { getBorrowDefaults, getReserveDefaults, toLocalInputValue } from "@/lib/cart/defaults"
import { initialActionState } from "@/lib/actionState"
import styles from "./OneClickPrompt.module.css"

interface OneClickPromptProps {
    open: boolean
    onClose: () => void
    mode: "borrow" | "reserve"
    familyId: string
    familyName: string
}

/**
 * Single-family Borrow/Reserve prompt for browse's one-click row actions.
 * Deliberately a separate component from CartCheckoutModal despite sharing
 * the same submitBorrowOrReserve action -- this one resolves availability
 * itself on open (browse rows don't carry per-item data), while the cart
 * modal just reads whatever's already in CartContext.
 */
export function OneClickPrompt({ open, onClose, mode, familyId, familyName }: OneClickPromptProps) {
    const [available, setAvailable] = useState<AvailableItem[] | null>(null)
    const [total, setTotal] = useState(0)
    const [state, formAction] = useActionState(submitBorrowOrReserve, initialActionState)

    useEffect(() => {
        if (!open) {
            return
        }
        let cancelled = false
        resolveFamilyAvailability(familyId).then((result) => {
            if (!cancelled) {
                setAvailable(result.items)
                setTotal(result.total)
            }
        })
        return () => {
            cancelled = true
            // Reset in the cleanup (runs when the effect re-fires or unmounts, not
            // synchronously in the body) so re-opening the prompt shows a fresh loading
            // state instead of a stale previous result.
            setAvailable(null)
        }
    }, [open, familyId])

    useEffect(() => {
        if (state.success) {
            onClose()
        }
        // Only re-run when a fresh success arrives -- onClose intentionally excluded
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state])

    const borrowDefaults = getBorrowDefaults()
    const reserveDefaults = getReserveDefaults()
    const title = mode === "borrow" ? `Borrow ${familyName}` : `Reserve ${familyName}`

    return (
        <Modal open={open} onClose={onClose} title={title}>
            {available === null ? (
                <p className={styles.loading}>Checking availability…</p>
            ) : available.length === 0 ? (
                <p className={styles.empty}>None of {familyName} is currently available.</p>
            ) : (
                <form action={formAction}>
                    {available.map((item) => (
                        <input key={item.id} type="hidden" name="ids" value={item.id} />
                    ))}
                    <input type="hidden" name="mode" value={mode} />

                    {available.length < total && (
                        <Badge variant="warning">
                            {available.length} of {total} available — {total - available.length} currently borrowed
                        </Badge>
                    )}

                    {mode === "borrow" ? (
                        <label className={styles.field}>
                            Return by
                            <input type="datetime-local" name="returnBy" defaultValue={toLocalInputValue(borrowDefaults.end)} required />
                        </label>
                    ) : (
                        <>
                            <label className={styles.field}>
                                Start
                                <input type="datetime-local" name="start" defaultValue={toLocalInputValue(reserveDefaults.start)} required />
                            </label>
                            <label className={styles.field}>
                                End
                                <input type="datetime-local" name="end" defaultValue={toLocalInputValue(reserveDefaults.end)} required />
                            </label>
                        </>
                    )}
                    <label className={styles.field}>
                        Notes
                        <input type="text" name="notes" />
                    </label>

                    {state.error && <Alert variant="error">{state.error}</Alert>}

                    <Button type="submit">
                        {mode === "borrow" ? "Borrow" : "Reserve"} {available.length} item{available.length === 1 ? "" : "s"}
                    </Button>
                </form>
            )}
        </Modal>
    )
}
