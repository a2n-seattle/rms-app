import { getSession } from "@/lib/session"
import { getBorrowGroup } from "@/lib/api/getBorrowGroup"
import { returnItem } from "@/lib/api/returnItem"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { ActionState, runAction } from "@/lib/actionState"
import { ReturnGroupSelection } from "./ReturnGroupSelection"
import styles from "./return-group.module.css"

export default async function ReturnGroupPage({ params }: { params: Promise<{ groupId: string }> }) {
    const session = await getSession()
    if (!session) {
        return null
    }

    const { groupId } = await params
    const { items } = await getBorrowGroup(session.idToken, { borrowGroupId: groupId })

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
            // Only pass through condition notes for items actually being
            // returned in this submission -- a note typed for a since-
            // deselected item shouldn't attach to an item that isn't returning.
            const conditions = Object.fromEntries(
                ids.filter((id) => allConditions[id]?.trim()).map((id) => [id, allConditions[id]])
            )

            await returnItem(session.idToken, {
                ids,
                borrower: session.sub,
                notes: notes || undefined,
                conditions: Object.keys(conditions).length > 0 ? conditions : undefined,
            })
            revalidatePath("/dashboard")
            revalidatePath("/return")
            redirect("/dashboard?tab=borrowed")
        })
    }

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Return Items</h1>
            </div>
            {items.length === 0 ? (
                <p className={styles.empty}>Nothing left to return in this group.</p>
            ) : (
                <ReturnGroupSelection items={items} returnAction={returnAction} />
            )}
        </div>
    )
}
