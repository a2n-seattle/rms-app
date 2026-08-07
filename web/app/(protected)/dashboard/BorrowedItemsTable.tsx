"use client"

import { useEffect, useRef, useState } from "react"
import { Table } from "@/components/ui/Table"
import { Checkbox } from "@/components/ui/Checkbox"
import { ButtonLink } from "@/components/ui/ButtonLink"
import type { ItemsSchema } from "@/lib/api/types"
import styles from "./dashboard.module.css"

export function BorrowedItemsTable({ items }: { items: ItemsSchema[] }) {
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const headerCheckboxRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!headerCheckboxRef.current) {
            return
        }
        headerCheckboxRef.current.checked = selected.size > 0 && selected.size === items.length
        headerCheckboxRef.current.indeterminate = selected.size > 0 && selected.size < items.length
    }, [items, selected])

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

    function toggleAll() {
        setSelected((prev) => (prev.size === items.length ? new Set() : new Set(items.map((item) => item.id))))
    }

    const selectedIds = Array.from(selected)
    const returnHref = `/return?${selectedIds.map((id) => `ids=${encodeURIComponent(id)}`).join("&")}`

    return (
        <div>
            <div className={styles.borrowedActions}>
                <ButtonLink
                    href={selectedIds.length > 0 ? returnHref : undefined}
                    aria-disabled={selectedIds.length === 0}
                    className={selectedIds.length === 0 ? styles.buttonLinkDisabled : undefined}
                >
                    Return Selected ({selectedIds.length})
                </ButtonLink>
            </div>
            <Table>
                <thead>
                    <tr>
                        <th className={styles.checkboxCell}>
                            <Checkbox
                                ref={headerCheckboxRef}
                                onChange={toggleAll}
                                aria-label="Select all currently borrowed items"
                            />
                        </th>
                        <th>Item</th>
                        <th>Borrowed</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => (
                        <tr key={item.id}>
                            <td className={styles.checkboxCell}>
                                <Checkbox
                                    checked={selected.has(item.id)}
                                    onChange={() => toggle(item.id)}
                                    aria-label={`Select ${item.name || item.id}`}
                                />
                            </td>
                            <td>
                                <a href={`/items/${encodeURIComponent(item.id)}`} className={styles.itemLink}>
                                    {item.name || item.id}
                                </a>
                            </td>
                            <td>{item.borrowTime ? new Date(item.borrowTime).toLocaleString() : "—"}</td>
                            <td className={styles.notes}>{item.notes || "—"}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    )
}
