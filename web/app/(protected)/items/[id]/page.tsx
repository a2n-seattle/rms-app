import { getSession } from "@/lib/session"
import { getItem } from "@/lib/api/getItem"
import { borrowItem } from "@/lib/api/borrowItem"
import { returnItem } from "@/lib/api/returnItem"
import { createReservation } from "@/lib/api/createReservation"
import { revalidatePath } from "next/cache"

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
            <h1>{main.displayName}</h1>
            <p>{main.description}</p>
            <p>Owner: {main.owner}</p>
            <p>Location: {main.location}</p>
            {instance && (
                <>
                    <p>Borrower: {instance.borrower || "(available)"}</p>
                    {instance.borrower ? (
                        <form action={returnAction}>
                            <button type="submit">Return</button>
                        </form>
                    ) : (
                        <form action={borrowAction}>
                            <button type="submit">Borrow</button>
                        </form>
                    )}
                </>
            )}
            <h2>Reserve this item</h2>
            <form action={reserveAction}>
                <label>
                    Start: <input type="datetime-local" name="start" required />
                </label>
                <label>
                    End: <input type="datetime-local" name="end" required />
                </label>
                <label>
                    Notes: <input type="text" name="notes" />
                </label>
                <button type="submit">Reserve</button>
            </form>
            <p>
                <a href="/reservations">View my reservations</a>
            </p>
        </div>
    )
}
