import { getSession } from "@/lib/session"
import { listItems } from "@/lib/api/listItems"
import { Card } from "@/components/ui/Card"
import styles from "./browse.module.css"

export default async function BrowsePage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string }>
}) {
    const session = await getSession()
    if (!session) {
        return null
    }

    const { page } = await searchParams
    const { items, nextPageToken } = await listItems(session.idToken, { pageToken: page })

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Browse Items</h1>
            </div>
            <Card>
                <ul className={styles.list}>
                    {items.map((item) => (
                        <li key={item.id}>
                            <a href={`/items/${encodeURIComponent(item.id)}`} className={styles.itemRow}>
                                {item.displayName}
                            </a>
                        </li>
                    ))}
                </ul>
            </Card>
            {nextPageToken && (
                <div className={styles.footer}>
                    <a href={`/browse?page=${encodeURIComponent(nextPageToken)}`} className={styles.loadMore}>
                        Load more
                    </a>
                </div>
            )}
        </div>
    )
}
