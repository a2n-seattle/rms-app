import { getSession } from "@/lib/session"
import { getItem } from "@/lib/api/getItem"
import { borrowItem } from "@/lib/api/borrowItem"
import { returnItem } from "@/lib/api/returnItem"
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
        </div>
    )
}
