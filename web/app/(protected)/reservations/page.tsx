import { getSession } from "@/lib/session"
import { listReservations } from "@/lib/api/listReservations"
import { Card } from "@/components/ui/Card"
import { Table } from "@/components/ui/Table"
import styles from "./reservations.module.css"

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
        borrower: session.sub,
        pageToken: page,
    })

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>My Reservations</h1>
            </div>
            <Card>
                <Table>
                    <thead>
                        <tr>
                            <th>Items</th>
                            <th>Start</th>
                            <th>End</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((reservation) => (
                            <tr key={reservation.id}>
                                <td>{reservation.itemIds.join(", ")}</td>
                                <td>{new Date(reservation.startTime).toLocaleString()}</td>
                                <td>{new Date(reservation.endTime).toLocaleString()}</td>
                                <td className={styles.notes}>{reservation.notes || "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card>
            {/*
              nextPageToken can be present even when `items` is empty this
              page -- DynamoDB applies the borrower FilterExpression after
              Limit, so a page can come back with zero matches while more
              data remains. Keep the link keyed off nextPageToken alone.
            */}
            {nextPageToken && (
                <div className={styles.footer}>
                    <a href={`/reservations?page=${encodeURIComponent(nextPageToken)}`} className={styles.loadMore}>
                        Load more
                    </a>
                </div>
            )}
        </div>
    )
}
