import { getSession } from "@/lib/session"
import { listReservations } from "@/lib/api/listReservations"

export default async function ReservationsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string }>
}) {
    const session = await getSession()
    if (!session) {
        return null
    }

    const { page } = await searchParams
    const { items, nextPageToken } = await listReservations(session.idToken, {
        borrower: session.email,
        pageToken: page,
    })

    return (
        <div>
            <h1>My Reservations</h1>
            <ul>
                {items.map((reservation) => (
                    <li key={reservation.id}>
                        {reservation.itemIds.join(", ")} — {new Date(reservation.startTime).toLocaleString()} to{" "}
                        {new Date(reservation.endTime).toLocaleString()}
                        {reservation.notes && ` (${reservation.notes})`}
                    </li>
                ))}
            </ul>
            {/*
              nextPageToken can be present even when `items` is empty this
              page -- DynamoDB applies the borrower FilterExpression after
              Limit, so a page can come back with zero matches while more
              data remains. Keep the link keyed off nextPageToken alone.
            */}
            {nextPageToken && <a href={`/reservations?page=${encodeURIComponent(nextPageToken)}`}>Load more</a>}
        </div>
    )
}
