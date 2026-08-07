"use client"

import { useActionState, useEffect, useState } from "react"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { Alert } from "@/components/ui/Alert"
import { useCart } from "@/lib/cart/CartContext"
import { submitBorrowOrReserve } from "@/lib/actions/cart"
import { getBorrowDefaults, getReserveDefaults, toLocalInputValue } from "@/lib/cart/defaults"
import { initialActionState } from "@/lib/actionState"
import styles from "./CartCheckoutModal.module.css"

interface CartCheckoutModalProps {
    open: boolean
    onClose: () => void
}

/**
 * Reads useActionState() directly instead of using <ActionForm> -- unlike
 * every other form in this app, this one needs a completion callback (clear
 * the cart and close itself on success), which ActionForm doesn't expose.
 */
export function CartCheckoutModal({ open, onClose }: CartCheckoutModalProps) {
    const cart = useCart()
    const [mode, setMode] = useState<"borrow" | "reserve">("borrow")
    const [state, formAction] = useActionState(submitBorrowOrReserve, initialActionState)

    useEffect(() => {
        if (state.success) {
            cart.clear()
            onClose()
        }
        // Only re-run when a fresh success arrives -- cart/onClose intentionally excluded
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state])

    const borrowDefaults = getBorrowDefaults()
    const reserveDefaults = getReserveDefaults()

    return (
        <Modal open={open} onClose={onClose} title="Checkout">
            {cart.entries.length === 0 ? (
                <p className={styles.empty}>Your cart is empty.</p>
            ) : (
                <form action={formAction}>
                    <ul className={styles.entryList}>
                        {cart.entries.map((entry) => (
                            <li key={entry.itemId} className={styles.entryRow}>
                                <input type="hidden" name="ids" value={entry.itemId} />
                                <span>
                                    {entry.familyName} — {entry.itemName}
                                </span>
                                <button
                                    type="button"
                                    className={styles.removeButton}
                                    onClick={() => cart.removeEntry(entry.itemId)}
                                    aria-label={`Remove ${entry.itemName} from cart`}
                                >
                                    ×
                                </button>
                            </li>
                        ))}
                    </ul>

                    <input type="hidden" name="mode" value={mode} />
                    <div className={styles.modeToggle}>
                        <label>
                            <input type="radio" name="modeToggle" checked={mode === "borrow"} onChange={() => setMode("borrow")} />
                            Borrow now
                        </label>
                        <label>
                            <input type="radio" name="modeToggle" checked={mode === "reserve"} onChange={() => setMode("reserve")} />
                            Reserve for later
                        </label>
                    </div>

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

                    <Button type="submit" disabled={cart.entries.length === 0}>
                        {mode === "borrow" ? "Borrow" : "Reserve"} {cart.entries.length} item{cart.entries.length === 1 ? "" : "s"}
                    </Button>
                </form>
            )}
        </Modal>
    )
}
