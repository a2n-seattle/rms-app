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
import { ActionState, runAction } from "@/lib/actionState"
import { Card } from "@/components/ui/Card"
import { Table } from "@/components/ui/Table"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { TabList, Tab } from "@/components/ui/Tabs"
import { ActionForm } from "@/components/ui/ActionForm"
import { DeleteReservationButton } from "./DeleteReservationButton"
import { BorrowedItemsTable } from "./BorrowedItemsTable"
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

    // `upcoming`/`overdue` back the alert banners shown above the tabs regardless of which
    // tab is active, so those two are always fetched. `borrowed`/`owned`/`history` only
    // back their own tab's content, so skip the Scan entirely when that tab isn't active --
    // this repo's DynamoDB tables are deliberately provisioned at 1 RCU/1 WCU (see root
    // CLAUDE.md), and this page's fan-out is the single biggest per-render read cost.
    const [upcoming, overdue, borrowed, owned] = await Promise.all([
        listUpcomingReservations(session.idToken, { borrower: session.sub }),
        listOverdueItems(session.idToken, { borrower: session.sub }),
        tab === "borrowed" ? listMyBorrowedItems(session.idToken, { borrower: session.sub }) : undefined,
        tab === "owned" ? listMyOwnedItems(session.idToken, { ownerId: session.sub }) : undefined,
    ])
    const history = tab === "history" ? await listHistory(session.idToken, { borrower: session.sub }) : undefined

    async function borrowFromScheduleAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
        "use server"
        return runAction(async () => {
            const session = await getSession()
            if (!session) {
                return
            }
            const scheduleId = formData.get("scheduleId") as string
            await borrowFromSchedule(session.idToken, { scheduleId })
            revalidatePath("/dashboard")
        })
    }

    async function cancelReservationAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
        "use server"
        return runAction(async () => {
            const session = await getSession()
            if (!session) {
                return
            }
            const scheduleId = formData.get("scheduleId") as string
            await deleteReservation(session.idToken, { id: scheduleId })
            revalidatePath("/dashboard")
        })
    }

    async function extendReservationAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
        "use server"
        return runAction(async () => {
            const session = await getSession()
            if (!session) {
                return
            }
            const scheduleId = formData.get("scheduleId") as string
            const newEndTime = new Date(formData.get("newEndTime") as string).getTime()
            await extendReservation(session.idToken, { id: scheduleId, newEndTime })
            revalidatePath("/dashboard")
        })
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
                                <Badge variant="danger">Overdue</Badge> {item.name || item.id} is overdue for
                                return
                            </span>
                        </div>
                    ))}
                    {upcoming.items.map((schedule) => (
                        <div key={schedule.id} className={styles.alert} data-testid="upcoming-alert">
                            <span className={styles.alertText}>
                                <Badge variant="warning">Upcoming</Badge> Reservation for{" "}
                                {schedule.itemIds.join(", ")} starts {new Date(schedule.startTime).toLocaleString()}
                                {schedule.notes ? ` — ${schedule.notes}` : ""}
                            </span>
                            <div className={styles.alertActions}>
                                <ActionForm action={borrowFromScheduleAction} successMessage="Borrowed successfully.">
                                    <input type="hidden" name="scheduleId" value={schedule.id} />
                                    <Button type="submit">Borrow</Button>
                                </ActionForm>
                                <DeleteReservationButton scheduleId={schedule.id} action={cancelReservationAction} />
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
                {/* borrowed is only undefined when tab !== "borrowed" (see the fetch above) */}
                {tab === "borrowed" &&
                    (borrowed!.items.length === 0 ? (
                        <p className={styles.empty}>Not currently borrowing anything.</p>
                    ) : (
                        <BorrowedItemsTable items={borrowed!.items} />
                    ))}

                {/* owned is only undefined when tab !== "owned" (see the fetch above) */}
                {tab === "owned" &&
                    (owned!.items.length === 0 ? (
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
                                {owned!.items.map((main) => (
                                    <tr key={main.id}>
                                        <td>{main.name}</td>
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
                                    <th>Cancel</th>
                                </tr>
                            </thead>
                            <tbody>
                                {upcoming.items.map((schedule) => (
                                    <tr key={schedule.id} data-testid="scheduled-row">
                                        <td>{schedule.itemIds.join(", ")}</td>
                                        <td>{new Date(schedule.startTime).toLocaleString()}</td>
                                        <td>{new Date(schedule.endTime).toLocaleString()}</td>
                                        <td className={styles.notes}>{schedule.notes || "—"}</td>
                                        <td>
                                            <ActionForm action={extendReservationAction} successMessage="Reservation extended." className={styles.extendForm}>
                                                <input type="hidden" name="scheduleId" value={schedule.id} />
                                                <input type="datetime-local" name="newEndTime" required aria-label="New end time" />
                                                <Button type="submit" variant="secondary">
                                                    Extend
                                                </Button>
                                            </ActionForm>
                                        </td>
                                        <td>
                                            <DeleteReservationButton scheduleId={schedule.id} action={cancelReservationAction} />
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
