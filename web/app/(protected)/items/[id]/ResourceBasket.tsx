"use client"

import { useState } from "react"
import { Table } from "@/components/ui/Table"
import { Checkbox } from "@/components/ui/Checkbox"
import { Button } from "@/components/ui/Button"
import type { ItemsSchema } from "@/lib/api/types"
import styles from "./resource-detail.module.css"

interface ResourceBasketProps {
    familyId: string
    items: ItemsSchema[]
    isRoom?: boolean
    borrowAction: (formData: FormData) => void
    reserveAction: (formData: FormData) => void
}

export function ResourceBasket({ familyId, items, isRoom, borrowAction, reserveAction }: ResourceBasketProps) {
    const [selected, setSelected] = useState<Set<string>>(new Set(items.map((item) => item.id)))

    function toggle(id: string) {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    function selectAll() {
        setSelected(new Set(items.map((item) => item.id)))
    }

    function selectNone() {
        setSelected(new Set())
    }

    const selectedIds = Array.from(selected)

    return (
        <div>
            <div className={styles.toolbar}>
                <span className={styles.selectionSummary}>
                    {selected.size} of {items.length} selected
                </span>
                <div className={styles.toggleActions}>
                    <button type="button" className={styles.toggleLink} onClick={selectAll}>
                        Select all
                    </button>
                    <button type="button" className={styles.toggleLink} onClick={selectNone}>
                        Select none
                    </button>
                </div>
            </div>
            <Table>
                <thead>
                    <tr>
                        <th className={styles.checkboxCell}></th>
                        <th>Item</th>
                        {!isRoom && <th>Borrower</th>}
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => (
                        <tr key={item.id}>
                            <td className={styles.checkboxCell}>
                                <Checkbox checked={selected.has(item.id)} onChange={() => toggle(item.id)} />
                            </td>
                            <td>
                                <a href={`/items/${encodeURIComponent(familyId)}/${encodeURIComponent(item.id)}`} className={styles.itemLink}>
                                    {item.name || item.id}
                                </a>
                            </td>
                            {!isRoom && <td>{item.borrower || "(available)"}</td>}
                            <td>{item.notes || "—"}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {!isRoom && (
                <form action={borrowAction} className={styles.actionBar}>
                    {selectedIds.map((id) => (
                        <input key={id} type="hidden" name="ids" value={id} />
                    ))}
                    <label className={styles.field}>
                        Return by
                        <input type="datetime-local" name="returnBy" required />
                    </label>
                    <Button type="submit" disabled={selectedIds.length === 0}>
                        Borrow Selected ({selectedIds.length})
                    </Button>
                </form>
            )}

            <form action={reserveAction} className={styles.actionBar}>
                {selectedIds.map((id) => (
                    <input key={id} type="hidden" name="ids" value={id} />
                ))}
                <label className={styles.field}>
                    Start
                    <input type="datetime-local" name="start" required />
                </label>
                <label className={styles.field}>
                    End
                    <input type="datetime-local" name="end" required />
                </label>
                <label className={styles.field}>
                    Notes
                    <input type="text" name="notes" />
                </label>
                <Button type="submit" variant="secondary" disabled={selectedIds.length === 0}>
                    Reserve Selected ({selectedIds.length})
                </Button>
            </form>
        </div>
    )
}
