import { getSession } from "@/lib/session"
import { getBatch } from "@/lib/api/getBatch"
import { Card } from "@/components/ui/Card"
import { Table } from "@/components/ui/Table"
import styles from "./batch-detail.module.css"

export default async function BatchDetailPage({ params }: { params: Promise<{ name: string }> }) {
    const session = await getSession()
    if (!session) {
        return null
    }

    const { name } = await params
    const entries = await getBatch(session.idToken, { name })

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>{name}</h1>
            </div>
            <Card>
                <Table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Resource</th>
                            <th>Owner</th>
                            <th>Borrower</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry) => (
                            <tr key={entry.id}>
                                <td>
                                    <a href={`/items/${encodeURIComponent(entry.name)}/${encodeURIComponent(entry.id)}`} className={styles.itemLink}>
                                        {entry.id}
                                    </a>
                                </td>
                                <td>{entry.name}</td>
                                <td>{entry.owner}</td>
                                <td>{entry.borrower || "(available)"}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card>
        </div>
    )
}
