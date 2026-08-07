"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Table } from "@/components/ui/Table"
import { Badge } from "@/components/ui/Badge"
import { Checkbox } from "@/components/ui/Checkbox"
import { useCart } from "@/lib/cart/CartContext"
import { resolveFamilyAvailability } from "@/lib/actions/cart"
import { OneClickPrompt } from "@/components/cart/OneClickPrompt"
import { OneClickReturnPrompt } from "@/components/cart/OneClickReturnPrompt"
import type { MainSchema } from "@/lib/api/types"
import styles from "./browse.module.css"

interface AvailabilityFlag {
    added: number
    total: number
}

type PromptState = { mode: "borrow" | "reserve"; familyId: string; familyName: string } | { mode: "return"; familyId: string; familyName: string; ids: string[] } | null

interface ResourcesTableProps {
    items: MainSchema[]
    myBorrowedByFamily: Record<string, { id: string; name: string }[]>
}

export function ResourcesTable({ items, myBorrowedByFamily }: ResourcesTableProps) {
    const [filter, setFilter] = useState("")
    const cart = useCart()
    const [checkedFamilies, setCheckedFamilies] = useState<Set<string>>(new Set())
    const [addedItemsByFamily, setAddedItemsByFamily] = useState<Map<string, string[]>>(new Map())
    const [flagByFamily, setFlagByFamily] = useState<Map<string, AvailabilityFlag>>(new Map())
    const [prompt, setPrompt] = useState<PromptState>(null)
    const headerCheckboxRef = useRef<HTMLInputElement>(null)

    const filtered = useMemo(() => {
        const needle = filter.trim().toLowerCase()
        if (!needle) {
            return items
        }
        return items.filter(
            (item) =>
                item.name.toLowerCase().includes(needle) || item.tags.some((tag) => tag.toLowerCase().includes(needle))
        )
    }, [items, filter])

    useEffect(() => {
        if (!headerCheckboxRef.current) {
            return
        }
        const checkedCount = filtered.filter((item) => checkedFamilies.has(item.id)).length
        headerCheckboxRef.current.checked = checkedCount > 0 && checkedCount === filtered.length
        headerCheckboxRef.current.indeterminate = checkedCount > 0 && checkedCount < filtered.length
    }, [filtered, checkedFamilies])

    async function addFamilyToCart(family: MainSchema) {
        const { items: available } = await resolveFamilyAvailability(family.id)
        setAddedItemsByFamily((prev) => new Map(prev).set(family.id, available.map((item) => item.id)))
        setFlagByFamily((prev) => new Map(prev).set(family.id, { added: available.length, total: family.items.length }))
        cart.addEntries(
            available.map((item) => ({
                itemId: item.id,
                familyId: family.id,
                itemName: item.name,
                familyName: family.name,
            }))
        )
    }

    function removeFamilyFromCart(familyId: string) {
        cart.removeFamily(familyId)
        setAddedItemsByFamily((prev) => {
            const next = new Map(prev)
            next.delete(familyId)
            return next
        })
        setFlagByFamily((prev) => {
            const next = new Map(prev)
            next.delete(familyId)
            return next
        })
    }

    function toggleFamily(family: MainSchema, checked: boolean) {
        setCheckedFamilies((prev) => {
            const next = new Set(prev)
            if (checked) {
                next.add(family.id)
            } else {
                next.delete(family.id)
            }
            return next
        })
        if (checked) {
            addFamilyToCart(family)
        } else {
            removeFamilyFromCart(family.id)
        }
    }

    function toggleHeader(checked: boolean) {
        for (const item of filtered) {
            if (checkedFamilies.has(item.id) !== checked) {
                toggleFamily(item, checked)
            }
        }
    }

    return (
        <div>
            <div className={styles.filterBar}>
                <input
                    type="text"
                    placeholder="Filter by name or tag..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className={styles.filterInput}
                    aria-label="Filter resources"
                />
            </div>
            {filtered.length === 0 ? (
                <p className={styles.empty}>No resources match.</p>
            ) : (
                <Table>
                    <thead>
                        <tr>
                            <th>
                                <Checkbox
                                    ref={headerCheckboxRef}
                                    aria-label="Select all"
                                    onChange={(e) => toggleHeader(e.target.checked)}
                                />
                            </th>
                            <th>Name</th>
                            <th>Location</th>
                            <th># Items</th>
                            <th>Tags</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((item) => {
                            const myBorrowed = myBorrowedByFamily[item.id]
                            const flag = flagByFamily.get(item.id)
                            return (
                                <tr key={item.id}>
                                    <td>
                                        <Checkbox
                                            checked={checkedFamilies.has(item.id)}
                                            aria-label={`Add ${item.name} to cart`}
                                            onChange={(e) => toggleFamily(item, e.target.checked)}
                                        />
                                    </td>
                                    <td>
                                        <a href={`/items/${encodeURIComponent(item.id)}`} className={styles.itemLink}>
                                            {item.name}
                                        </a>
                                        {item.type === "room" && <Badge>Room</Badge>}
                                        {flag && flag.added < flag.total && (
                                            <div>
                                                <Badge variant="warning">
                                                    {flag.added} of {flag.total} added — {flag.total - flag.added} currently
                                                    borrowed
                                                </Badge>
                                            </div>
                                        )}
                                    </td>
                                    <td>{item.location}</td>
                                    <td>{item.items.length}</td>
                                    <td className={styles.tagList}>{item.tags.join(", ") || "—"}</td>
                                    <td className={styles.actionsCell}>
                                        <button
                                            type="button"
                                            className={styles.actionIcon}
                                            aria-label={`Borrow ${item.name}`}
                                            onClick={() => setPrompt({ mode: "borrow", familyId: item.id, familyName: item.name })}
                                        >
                                            Borrow
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.actionIcon}
                                            aria-label={`Reserve ${item.name}`}
                                            onClick={() => setPrompt({ mode: "reserve", familyId: item.id, familyName: item.name })}
                                        >
                                            Reserve
                                        </button>
                                        {myBorrowed && myBorrowed.length > 0 && (
                                            <button
                                                type="button"
                                                className={styles.actionIcon}
                                                aria-label={`Return ${item.name}`}
                                                onClick={() =>
                                                    setPrompt({
                                                        mode: "return",
                                                        familyId: item.id,
                                                        familyName: item.name,
                                                        ids: myBorrowed.map((b) => b.id),
                                                    })
                                                }
                                            >
                                                Return
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </Table>
            )}

            {prompt && prompt.mode !== "return" && (
                <OneClickPrompt
                    open={true}
                    onClose={() => setPrompt(null)}
                    mode={prompt.mode}
                    familyId={prompt.familyId}
                    familyName={prompt.familyName}
                />
            )}
            {prompt && prompt.mode === "return" && (
                <OneClickReturnPrompt open={true} onClose={() => setPrompt(null)} ids={prompt.ids} familyName={prompt.familyName} />
            )}
        </div>
    )
}
