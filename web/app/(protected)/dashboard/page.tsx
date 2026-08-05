import { getSession } from "@/lib/session"
import { listMyOwnedItems } from "@/lib/api/listMyOwnedItems"
import { listMyBorrowedItems } from "@/lib/api/listMyBorrowedItems"
import { listUpcomingReservations } from "@/lib/api/listUpcomingReservations"
import { listOverdueItems } from "@/lib/api/listOverdueItems"
import { listHistory } from "@/lib/api/listHistory"
import { borrowFromSchedule } from "@/lib/api/borrowFromSchedule"
import { deleteReservation } from "@/lib/api/deleteReservation"
import { extendReservation } from "@/lib/api/extendReservation"
import { revalidatePath } from "next/cache"
import { Card } from "@/components/ui/Card"
import { Table } from "@/components/ui/Table"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { TabList, Tab } from "@/components/ui/Tabs"
import styles from "./dashboard.module.css"

type DashboardTab = "borrowed" | "owned" | "scheduled" | "history"

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string }>
}) {
    const session = await getSession()
    if (!session) {
        return null
    }

    const { tab: tabParam } = await searchParams
    const tab: DashboardTab = (["borrowed", "owned", "scheduled", "history"] as const).includes(tabParam as DashboardTab)
        ? (tabParam as DashboardTab)
        : "borrowed"

    const [borrowed, owned, upcoming, overdue] = await Promise.all([
        listMyBorrowedItems(session.idToken, { borrower: session.email }),
        listMyOwnedItems(session.idToken, { owner: session.email }),
        listUpcomingReservations(session.idToken, { borrower: session.email }),
        listOverdueItems(session.idToken, { borrower: session.email }),
    ])
    const history = tab === "history" ? await listHistory(session.idToken, { borrower: session.email }) : undefined

    async function borrowFromScheduleAction(formData: FormData) {
        "use server"
        const session = await getSession()
        if (!session) {
            return
        }
        const scheduleId = formData.get("scheduleId") as string
        await borrowFromSchedule(session.idToken, { scheduleId })
        revalidatePath("/dashboard")
    }

    async function cancelReservationAction(formData: FormData) {
        "use server"
        const session = await getSession()
        if (!session) {
            return
        }
        const scheduleId = formData.get("scheduleId") as string
        await deleteReservation(session.idToken, { id: scheduleId })
        revalidatePath("/dashboard")
    }

    async function extendReservationAction(formData: FormData) {
        "use server"
        const session = await getSession()
        if (!session) {
            return
        }
        const scheduleId = formData.get("scheduleId") as string
        const newEndTime = new Date(formData.get("newEndTime") as string).getTime()
        await extendReservation(session.idToken, { id: scheduleId, newEndTime })
        revalidatePath("/dashboard")
    }

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Dashboard</h1>
            </div>

            {(overdue.items.length > 0 || upcoming.items.length > 0) && (
                <div className={styles.alerts}>
                    {overdue.items.map((item) => (
                        <div key={item.id} className={`${styles.alert} ${styles.alertOverdue}`}>
                            <span className={styles.alertText}>
                                <Badge variant="danger">Overdue</Badge> {item.friendlyName || item.id} is overdue for
                                return
                            </span>
                        </div>
                    ))}
                    {upcoming.items.map((schedule) => (
                        <div key={schedule.id} className={styles.alert}>
                            <span className={styles.alertText}>
                                <Badge variant="warning">Upcoming</Badge> Reservation for{" "}
                                {schedule.itemIds.join(", ")} starts {new Date(schedule.startTime).toLocaleString()}
                            </span>
                            <div className={styles.alertActions}>
                                <form action={borrowFromScheduleAction}>
                                    <input type="hidden" name="scheduleId" value={schedule.id} />
                                    <Button type="submit">Borrow</Button>
                                </form>
                                <form action={cancelReservationAction}>
                                    <input type="hidden" name="scheduleId" value={schedule.id} />
                                    <Button type="submit" variant="secondary">
                                        Cancel
                                    </Button>
                                </form>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <TabList>
                <Tab href="/dashboard?tab=borrowed" active={tab === "borrowed"}>
                    Currently Borrowed
                </Tab>
                <Tab href="/dashboard?tab=owned" active={tab === "owned"}>
                    Owned Items
                </Tab>
                <Tab href="/dashboard?tab=scheduled" active={tab === "scheduled"}>
                    Scheduled
                </Tab>
                <Tab href="/dashboard?tab=history" active={tab === "history"}>
                    History
                </Tab>
            </TabList>

            <Card>
                {tab === "borrowed" &&
                    (borrowed.items.length === 0 ? (
                        <p className={styles.empty}>Not currently borrowing anything.</p>
                    ) : (
                        <>
                            <a href="/return" className={styles.itemLink}>
                                Return items
                            </a>
                            <Table>
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Borrowed</th>
                                        <th>Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {borrowed.items.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <a href={`/items/${encodeURIComponent(item.id)}`} className={styles.itemLink}>
                                                    {item.friendlyName || item.id}
                                                </a>
                                            </td>
                                            <td>{item.borrowTime ? new Date(item.borrowTime).toLocaleString() : "—"}</td>
                                            <td className={styles.notes}>{item.notes || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </>
                    ))}

                {tab === "owned" &&
                    (owned.items.length === 0 ? (
                        <p className={styles.empty}>You don&apos;t own any resources.</p>
                    ) : (
                        <Table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Location</th>
                                    <th># Items</th>
                                </tr>
                            </thead>
                            <tbody>
                                {owned.items.map((main) => (
                                    <tr key={main.id}>
                                        <td>{main.displayName}</td>
                                        <td>{main.location}</td>
                                        <td>{main.items.length}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    ))}

                {tab === "scheduled" &&
                    (upcoming.items.length === 0 ? (
                        <p className={styles.empty}>No upcoming reservations.</p>
                    ) : (
                        <Table>
                            <thead>
                                <tr>
                                    <th>Items</th>
                                    <th>Start</th>
                                    <th>End</th>
                                    <th>Notes</th>
                                    <th>Extend</th>
                                </tr>
                            </thead>
                            <tbody>
                                {upcoming.items.map((schedule) => (
                                    <tr key={schedule.id}>
                                        <td>{schedule.itemIds.join(", ")}</td>
                                        <td>{new Date(schedule.startTime).toLocaleString()}</td>
                                        <td>{new Date(schedule.endTime).toLocaleString()}</td>
                                        <td className={styles.notes}>{schedule.notes || "—"}</td>
                                        <td>
                                            <form action={extendReservationAction} className={styles.extendForm}>
                                                <input type="hidden" name="scheduleId" value={schedule.id} />
                                                <input
                                                    type="datetime-local"
                                                    name="newEndTime"
                                                    required
                                                    aria-label={`New end time for reservation ${schedule.id}`}
                                                />
                                                <Button type="submit" variant="secondary">
                                                    Extend
                                                </Button>
                                            </form>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    ))}

                {tab === "history" &&
                    (!history || history.items.length === 0 ? (
                        <p className={styles.empty}>No history yet.</p>
                    ) : (
                        <Table>
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Action</th>
                                    <th>When</th>
                                    <th>Notes</th>
                                    <th>Condition</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.items.map((entry) => (
                                    <tr key={entry.id}>
                                        <td>
                                            <a
                                                href={`/items/${encodeURIComponent(entry.itemId)}`}
                                                className={styles.itemLink}
                                            >
                                                {entry.itemId}
                                            </a>
                                        </td>
                                        <td>{entry.action}</td>
                                        <td>{new Date(entry.timestamp).toLocaleString()}</td>
                                        <td className={styles.notes}>{entry.notes || "—"}</td>
                                        <td className={styles.notes}>{entry.condition || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    ))}
            </Card>
        </div>
    )
}
