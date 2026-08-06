"use client"

import { useState } from "react"
import { useCart } from "@/lib/cart/CartContext"
import { CartCheckoutModal } from "@/components/cart/CartCheckoutModal"
import styles from "./CartBadge.module.css"

/** Fixed bottom-right cart indicator, mounted once in the protected layout. */
export function CartBadge() {
    const { count } = useCart()
    const [open, setOpen] = useState(false)

    if (count === 0) {
        return null
    }

    return (
        <>
            <button type="button" className={styles.badge} onClick={() => setOpen(true)} aria-label={`Open cart (${count} items)`}>
                🛒 {count}
            </button>
            <CartCheckoutModal open={open} onClose={() => setOpen(false)} />
        </>
    )
}
