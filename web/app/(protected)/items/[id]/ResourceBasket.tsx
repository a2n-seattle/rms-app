"use client"

import { useEffect, useRef, useState } from "react"
import { Table } from "@/components/ui/Table"
import { Checkbox } from "@/components/ui/Checkbox"
import { Button } from "@/components/ui/Button"
import { ActionForm } from "@/components/ui/ActionForm"
import { EditSubItemModal } from "@/components/items/EditSubItemModal"
import { getBorrowByDefault, getReserveDefaults, toLocalInputValue } from "@/lib/formDefaults"
import type { ActionState } from "@/lib/actionState"
import type { ItemsSchema } from "@/lib/api/types"
import styles from "./resource-detail.module.css"

interface ResourceBasketProps {
    familyId: string
    items: ItemsSchema[]
    isRoom?: boolean
    borrowAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
    reserveAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
    updateSubItemAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
    deleteSubItemAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
}

export function ResourceBasket({
    familyId,
    items,
    isRoom,
    borrowAction,
    reserveAction,
    updateSubItemAction,
    deleteSubItemAction,
}: ResourceBasketProps) {
    const [selected, setSelected] = useState<Set<string>>(new Set(items.map((item) => item.id)))
    const [editingItem, setEditingItem] = useState<ItemsSchema | null>(null)
    const headerCheckboxRef = useRef<HTMLInputElement>(null)
    const [borrowByDefault] = useState(getBorrowByDefault)
    const [reserveDefaults] = useState(getReserveDefaults)

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

    return (
        <div>
            <Table>
                <thead>
                    <tr>
                        <th className={styles.checkboxCell}>
                            <Checkbox ref={headerCheckboxRef} onChange={toggleAll} aria-label="Select all sub-items" />
                        </th>
                        <th>Item</th>
                        {!isRoom && <th>Borrower</th>}
                        <th>Notes</th>
                        <th></th>
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
                                <a href={`/items/${encodeURIComponent(familyId)}/${encodeURIComponent(item.id)}`} className={styles.itemLink}>
                                    {item.name || item.id}
                                </a>
                            </td>
                            {!isRoom && <td>{item.borrower || "(available)"}</td>}
                            <td>{item.notes || "—"}</td>
                            <td>
                                <button
                                    type="button"
                                    className={styles.toggleLink}
                                    aria-label={`Edit ${item.name || item.id}`}
                                    onClick={() => setEditingItem(item)}
                                >
                                    Edit
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {editingItem && (
                <EditSubItemModal
                    open={true}
                    onClose={() => setEditingItem(null)}
                    item={editingItem}
                    updateSubItemAction={updateSubItemAction}
                    deleteSubItemAction={deleteSubItemAction}
                />
            )}

            {!isRoom && (
                <ActionForm action={borrowAction} successMessage="Item(s) borrowed successfully." className={styles.actionBar}>
                    {selectedIds.map((id) => (
                        <input key={id} type="hidden" name="ids" value={id} />
                    ))}
                    <label className={styles.field}>
                        Return by
                        <input type="datetime-local" name="returnBy" defaultValue={toLocalInputValue(borrowByDefault)} required />
                    </label>
                    <Button type="submit" disabled={selectedIds.length === 0}>
                        Borrow Selected ({selectedIds.length})
                    </Button>
                </ActionForm>
            )}

            <ActionForm action={reserveAction} successMessage="Reservation created successfully." className={styles.actionBar}>
                {selectedIds.map((id) => (
                    <input key={id} type="hidden" name="ids" value={id} />
                ))}
                <label className={styles.field}>
                    Start
                    <input type="datetime-local" name="start" defaultValue={toLocalInputValue(reserveDefaults.start)} required />
                </label>
                <label className={styles.field}>
                    End
                    <input type="datetime-local" name="end" defaultValue={toLocalInputValue(reserveDefaults.end)} required />
                </label>
                <label className={styles.field}>
                    Notes
                    <input type="text" name="notes" />
                </label>
                <Button type="submit" variant="secondary" disabled={selectedIds.length === 0}>
                    Reserve Selected ({selectedIds.length})
                </Button>
            </ActionForm>
        </div>
    )
}
