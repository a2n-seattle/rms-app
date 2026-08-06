import { getSession } from "@/lib/session"
import { listItems } from "@/lib/api/listItems"
import { listMyBorrowedItems } from "@/lib/api/listMyBorrowedItems"
import { ResourcesTable } from "./ResourcesTable"
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
    // One extra list call, not per-row -- listMyBorrowedItems (rather than fetching every
    // family's full item data) is what lets a row show a one-click Return action for the
    // "forgot I had this borrowed" case without violating this repo's 1 RCU/1 WCU table
    // budget (see root CLAUDE.md).
    const [{ items, nextPageToken }, { items: myBorrowed }] = await Promise.all([
        listItems(session.idToken, { pageToken: page }),
        listMyBorrowedItems(session.idToken, { borrower: session.sub }),
    ])

    const myBorrowedByFamily: Record<string, { id: string; name: string }[]> = {}
    for (const item of myBorrowed) {
        ;(myBorrowedByFamily[item.familyId] ??= []).push({ id: item.id, name: item.name || item.id })
    }

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Resources</h1>
            </div>
            <ResourcesTable items={items} myBorrowedByFamily={myBorrowedByFamily} />
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
