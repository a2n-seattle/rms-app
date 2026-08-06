import { getSession } from "@/lib/session"
import { addItem } from "@/lib/api/addItem"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { ActionState, runAction } from "@/lib/actionState"
import { CreateItemForm } from "./CreateItemForm"
import styles from "./new-item.module.css"

export default async function NewItemPage() {
    const session = await getSession()
    if (!session) {
        return null
    }

    async function createItemAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
        "use server"
        return runAction(async () => {
            const session = await getSession()
            if (!session) {
                return
            }
            const name = formData.get("name") as string
            const description = formData.get("description") as string
            const location = formData.get("location") as string
            const tagsRaw = formData.get("tags") as string
            const friendlyName = formData.get("friendlyName") as string
            const notes = formData.get("notes") as string
            const tags = tagsRaw
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag.length > 0)

            const id = await addItem(session.idToken, {
                name,
                description: description || undefined,
                owner: session.email,
                location: location || undefined,
                tags,
                friendlyName: friendlyName || undefined,
                notes: notes || undefined,
            })
            revalidatePath("/browse")
            redirect(`/items/${encodeURIComponent(id)}`)
        })
    }

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Add item</h1>
            </div>
            <CreateItemForm action={createItemAction} />
        </div>
    )
}
