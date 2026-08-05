"use client"

import { useMemo, useState } from "react"
import { Table } from "@/components/ui/Table"
import { Badge } from "@/components/ui/Badge"
import type { MainSchema } from "@/lib/api/types"
import styles from "./browse.module.css"

export function ResourcesTable({ items }: { items: MainSchema[] }) {
    const [filter, setFilter] = useState("")

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
                            <th>Name</th>
                            <th>Location</th>
                            <th># Items</th>
                            <th>Tags</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((item) => (
                            <tr key={item.id}>
                                <td>
                                    <a href={`/items/${encodeURIComponent(item.id)}`} className={styles.itemLink}>
                                        {item.name}
                                    </a>
                                    {item.type === "room" && <Badge>Room</Badge>}
                                </td>
                                <td>{item.location}</td>
                                <td>{item.items.length}</td>
                                <td className={styles.tagList}>{item.tags.join(", ") || "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </div>
    )
}
