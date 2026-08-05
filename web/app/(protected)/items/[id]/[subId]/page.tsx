import { getSession } from "@/lib/session"
import { getItem } from "@/lib/api/getItem"
import { borrowItem } from "@/lib/api/borrowItem"
import { returnItem } from "@/lib/api/returnItem"
import { createReservation } from "@/lib/api/createReservation"
import { revalidatePath } from "next/cache"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { ButtonLink } from "@/components/ui/ButtonLink"
import styles from "./item-detail.module.css"

export default async function SubItemDetailPage({ params }: { params: Promise<{ id: string; subId: string }> }) {
    const session = await getSession()
    if (!session) {
        return null
    }

    const { id, subId } = await params
    const { main, items } = await getItem(session.idToken, { key: subId })
    const instance = items.find((i) => i.id === subId)

    async function borrowAction() {
        "use server"
        const session = await getSession()
        if (!session) {
            return
        }
        await borrowItem(session.idToken, { ids: [subId], borrower: session.sub })
        revalidatePath(`/items/${id}/${subId}`)
    }

    async function returnAction() {
        "use server"
        const session = await getSession()
        if (!session) {
            return
        }
        await returnItem(session.idToken, { ids: [subId], borrower: session.sub })
        revalidatePath(`/items/${id}/${subId}`)
    }

    async function reserveAction(formData: FormData) {
        "use server"
        const session = await getSession()
        if (!session) {
            return
        }
        const startTime = new Date(formData.get("start") as string).getTime()
        const endTime = new Date(formData.get("end") as string).getTime()
        const notes = formData.get("notes") as string

        await createReservation(session.idToken, {
            ids: [subId],
            borrower: session.sub,
            startTime,
            endTime,
            notes: notes || undefined,
        })
        revalidatePath(`/items/${id}/${subId}`)
    }

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>{main.name}</h1>
                <p className={styles.description}>{main.description}</p>
            </div>
            <Card className={styles.metaCard}>
                <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Owner</span>
                    <span>{main.owner}</span>
                </div>
                <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Location</span>
                    <span>{main.location}</span>
                </div>
                {instance && (
                    <>
                        <div className={styles.metaRow}>
                            <span className={styles.metaLabel}>Borrower</span>
                            <span>{instance.borrower || "(available)"}</span>
                        </div>
                        <div className={styles.borrowRow}>
                            {instance.borrower ? (
                                instance.borrowGroupId ? (
                                    // Borrowed as part of a reservation-backed group
                                    // (BorrowFromSchedule) -- send to the batched
                                    // return confirmation instead of returning just
                                    // this one item, since everything in the group
                                    // was borrowed together.
                                    <ButtonLink href={`/return-group/${encodeURIComponent(instance.borrowGroupId)}`} variant="secondary">
                                        Return
                                    </ButtonLink>
                                ) : (
                                    <form action={returnAction}>
                                        <Button type="submit" variant="secondary">
                                            Return
                                        </Button>
                                    </form>
                                )
                            ) : (
                                <form action={borrowAction}>
                                    <Button type="submit">Borrow</Button>
                                </form>
                            )}
                        </div>
                    </>
                )}
            </Card>
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Reserve this item</h2>
                <form action={reserveAction} className={styles.form}>
                    <label className={styles.field}>
                        Start
                        <input type="datetime-local" name="start" required />
                    </label>
                    <label className={styles.field}>
                        End
                        <input type="datetime-local" name="end" required />
                    </label>
                    <label className={styles.field}>
                        Notes
                        <input type="text" name="notes" />
                    </label>
                    <Button type="submit">Reserve</Button>
                </form>
            </div>
            <a href="/reservations" className={styles.footerLink}>
                View my reservations
            </a>
        </div>
    )
}
