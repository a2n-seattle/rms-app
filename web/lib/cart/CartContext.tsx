"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"

export interface CartEntry {
    itemId: string
    familyId: string
    itemName: string
    familyName: string
}

interface CartContextValue {
    entries: CartEntry[]
    count: number
    addEntries: (entries: CartEntry[]) => void
    removeEntry: (itemId: string) => void
    removeFamily: (familyId: string) => void
    clear: () => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

/**
 * The app's first piece of cross-page client state -- everywhere else,
 * selection is local useState<Set<string>> scoped to a single page (see
 * ResourceBasket.tsx, ReturnSelection.tsx). A cart has to survive
 * navigation between /browse and item detail pages, so it lives here,
 * mounted once around the protected layout.
 *
 * In-memory only (no localStorage) -- a full page reload clears the cart.
 * That's a deliberate scope boundary for GH-360's initial version, not an
 * oversight.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
    const [entries, setEntries] = useState<Map<string, CartEntry>>(new Map())

    const addEntries = useCallback((newEntries: CartEntry[]) => {
        setEntries((prev) => {
            const next = new Map(prev)
            for (const entry of newEntries) {
                next.set(entry.itemId, entry)
            }
            return next
        })
    }, [])

    const removeEntry = useCallback((itemId: string) => {
        setEntries((prev) => {
            if (!prev.has(itemId)) {
                return prev
            }
            const next = new Map(prev)
            next.delete(itemId)
            return next
        })
    }, [])

    const removeFamily = useCallback((familyId: string) => {
        setEntries((prev) => {
            const next = new Map(prev)
            for (const [itemId, entry] of prev) {
                if (entry.familyId === familyId) {
                    next.delete(itemId)
                }
            }
            return next
        })
    }, [])

    const clear = useCallback(() => setEntries(new Map()), [])

    const entriesArray = useMemo(() => Array.from(entries.values()), [entries])

    const value = useMemo(
        () => ({
            entries: entriesArray,
            count: entriesArray.length,
            addEntries,
            removeEntry,
            removeFamily,
            clear,
        }),
        [entriesArray, addEntries, removeEntry, removeFamily, clear]
    )

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
    const value = useContext(CartContext)
    if (!value) {
        throw new Error("useCart must be used within a CartProvider")
    }
    return value
}
