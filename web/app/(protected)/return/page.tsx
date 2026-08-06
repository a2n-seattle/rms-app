import { getSession } from "@/lib/session"
import { listMyBorrowedItems } from "@/lib/api/listMyBorrowedItems"
import { returnItem } from "@/lib/api/returnItem"
import { revalidatePath } from "next/cache"
import { ActionState, runAction } from "@/lib/actionState"
import { ReturnSelection } from "./ReturnSelection"
import styles from "./return.module.css"

export default async function ReturnPage({
    searchParams,
}: {
    searchParams: Promise<{ ids?: string | string[] }>
}) {
    const session = await getSession()
    if (!session) {
        return null
    }

    const { items } = await listMyBorrowedItems(session.idToken, { borrower: session.sub })
    const { ids: idsParam } = await searchParams
    const initialSelectedIds = idsParam === undefined ? undefined : Array.isArray(idsParam) ? idsParam : [idsParam]

    async function returnAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
        "use server"
        return runAction(async () => {
            const session = await getSession()
            if (!session) {
                return
            }
            const ids = formData.getAll("ids") as string[]
            const notes = formData.get("notes") as string
            const conditionsRaw = formData.get("conditions") as string
            const allConditions: Record<string, string> = conditionsRaw ? JSON.parse(conditionsRaw) : {}
            // Only pass through condition notes for items actually being returned in this
            // submission -- a note typed for a since-deselected item shouldn't attach to an
            // item that isn't returning.
            const conditions = Object.fromEntries(
                ids.filter((id) => allConditions[id]?.trim()).map((id) => [id, allConditions[id]])
            )

            await returnItem(session.idToken, {
                ids,
                borrower: session.sub,
                notes: notes || undefined,
                conditions: Object.keys(conditions).length > 0 ? conditions : undefined,
            })
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
                <ReturnSelection items={items} returnAction={returnAction} initialSelectedIds={initialSelectedIds} />
            )}
        </div>
    )
}
