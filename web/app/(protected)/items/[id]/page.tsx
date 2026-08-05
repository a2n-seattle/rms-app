import { getSession } from "@/lib/session"
import { getItem } from "@/lib/api/getItem"
import { borrowItem } from "@/lib/api/borrowItem"
import { returnItem } from "@/lib/api/returnItem"
import { createReservation } from "@/lib/api/createReservation"
import { revalidatePath } from "next/cache"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import styles from "./item-detail.module.css"

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session) {
        return null
    }

    const { id } = await params
    const { main, items } = await getItem(session.idToken, { key: id })
    const instance = items.find((i) => i.id === id)

    async function borrowAction() {
        "use server"
        const session = await getSession()
        if (!session) {
            return
        }
        await borrowItem(session.idToken, { ids: [id], borrower: session.email })
        revalidatePath(`/items/${id}`)
    }

    async function returnAction() {
        "use server"
        const session = await getSession()
        if (!session) {
            return
        }
        await returnItem(session.idToken, { ids: [id], borrower: session.email })
        revalidatePath(`/items/${id}`)
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
            ids: [id],
            borrower: session.email,
            startTime,
            endTime,
            notes: notes || undefined,
        })
        revalidatePath(`/items/${id}`)
    }

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>{main.displayName}</h1>
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
                                <form action={returnAction}>
                                    <Button type="submit" variant="secondary">
                                        Return
                                    </Button>
                                </form>
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
