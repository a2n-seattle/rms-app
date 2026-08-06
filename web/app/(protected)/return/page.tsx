import { getSession } from "@/lib/session"
import { listMyBorrowedItems } from "@/lib/api/listMyBorrowedItems"
import { returnItem } from "@/lib/api/returnItem"
import { revalidatePath } from "next/cache"
import { ActionState, runAction } from "@/lib/actionState"
import { ReturnSelection } from "./ReturnSelection"
import styles from "./return.module.css"

export default async function ReturnPage() {
    const session = await getSession()
    if (!session) {
        return null
    }

    const { items } = await listMyBorrowedItems(session.idToken, { borrower: session.sub })

    async function returnAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
        "use server"
        return runAction(async () => {
            const session = await getSession()
            if (!session) {
                return
            }
            const ids = formData.getAll("ids") as string[]
            const notes = formData.get("notes") as string

            await returnItem(session.idToken, { ids, borrower: session.sub, notes: notes || undefined })
            revalidatePath("/return")
            revalidatePath("/dashboard")
        })
    }

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Return Items</h1>
            </div>
            {items.length === 0 ? (
                <p className={styles.empty}>You have nothing currently borrowed.</p>
            ) : (
                <ReturnSelection items={items} returnAction={returnAction} />
            )}
        </div>
    )
}
