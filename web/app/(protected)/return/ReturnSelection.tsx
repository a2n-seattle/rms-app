"use client"

import { useState } from "react"
import { Table } from "@/components/ui/Table"
import { Checkbox } from "@/components/ui/Checkbox"
import { Button } from "@/components/ui/Button"
import { ActionForm } from "@/components/ui/ActionForm"
import type { ActionState } from "@/lib/actionState"
import type { ItemsSchema } from "@/lib/api/types"
import styles from "./return.module.css"

interface ReturnSelectionProps {
    items: ItemsSchema[]
    returnAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
    initialSelectedIds?: string[]
}

export function ReturnSelection({ items, returnAction, initialSelectedIds }: ReturnSelectionProps) {
    const [selected, setSelected] = useState<Set<string>>(
        new Set(initialSelectedIds ?? items.map((item) => item.id))
    )
    const [conditions, setConditions] = useState<Record<string, string>>({})

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
                        <th>Borrowed</th>
                        <th>Notes</th>
                        <th>Condition (if damaged)</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => (
                        <tr key={item.id}>
                            <td className={styles.checkboxCell}>
                                <Checkbox checked={selected.has(item.id)} onChange={() => toggle(item.id)} />
                            </td>
                            <td>
                                <a href={`/items/${encodeURIComponent(item.id)}/${encodeURIComponent(item.id)}`} className={styles.itemLink}>
                                    {item.name || item.id}
                                </a>
                            </td>
                            <td>{item.borrowTime ? new Date(item.borrowTime).toLocaleString() : "—"}</td>
                            <td>{item.notes || "—"}</td>
                            <td>
                                <input
                                    type="text"
                                    className={styles.conditionInput}
                                    placeholder="e.g. cracked screen"
                                    value={conditions[item.id] ?? ""}
                                    onChange={(e) => setConditions((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                    aria-label={`Condition notes for ${item.name || item.id}`}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <ActionForm action={returnAction} successMessage="Item(s) returned successfully." className={styles.actionBar}>
                {selectedIds.map((id) => (
                    <input key={id} type="hidden" name="ids" value={id} />
                ))}
                <input type="hidden" name="conditions" value={JSON.stringify(conditions)} />
                <label className={styles.field}>
                    Notes (applies to all returned items)
                    <input type="text" name="notes" />
                </label>
                <Button type="submit" disabled={selectedIds.length === 0}>
                    Confirm Return ({selectedIds.length})
                </Button>
            </ActionForm>
        </div>
    )
}
