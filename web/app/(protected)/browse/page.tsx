import { getSession } from "@/lib/session"
import { listItems } from "@/lib/api/listItems"

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
            <h1>Browse Items</h1>
            <ul>
                {items.map((item) => (
                    <li key={item.id}>
                        <a href={`/items/${encodeURIComponent(item.id)}`}>{item.displayName}</a>
                    </li>
                ))}
            </ul>
            {nextPageToken && <a href={`/browse?page=${encodeURIComponent(nextPageToken)}`}>Load more</a>}
        </div>
    )
}
