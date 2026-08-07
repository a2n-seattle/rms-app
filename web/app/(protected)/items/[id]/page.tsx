import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { getItem } from "@/lib/api/getItem"
import { createReservation } from "@/lib/api/createReservation"
import { borrowFromSchedule } from "@/lib/api/borrowFromSchedule"
import { addItem } from "@/lib/api/addItem"
import { deleteItem } from "@/lib/api/deleteItem"
import { updateItem } from "@/lib/api/updateItem"
import { updateSubItem } from "@/lib/api/updateSubItem"
import { revalidatePath } from "next/cache"
import { ActionState, runAction } from "@/lib/actionState"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { ResourceBasket } from "./ResourceBasket"
import { FamilyHeaderActions } from "./FamilyHeaderActions"
import styles from "./resource-detail.module.css"

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session) {
        return null
    }

    const { id } = await params
    const { main, items } = await getItem(session.idToken, { key: id })

    // GetItem resolves `key` against either a sub-item id or a family id;
    // `main.id` is always the resolved family's id either way. If `id`
    // itself isn't the family id, it was a sub-item id -- redirect to the
    // nested sub-item route rather than showing the (single-item) basket.
    if (id !== main.id) {
        redirect(`/items/${encodeURIComponent(main.id)}/${encodeURIComponent(id)}`)
    }

    async function reserveAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
        "use server"
        return runAction(async () => {
            const session = await getSession()
            if (!session) {
                return
            }
            const ids = formData.getAll("ids") as string[]
            const startTime = new Date(formData.get("start") as string).getTime()
            const endTime = new Date(formData.get("end") as string).getTime()
            const notes = formData.get("notes") as string

            await createReservation(session.idToken, {
                ids,
                borrower: session.sub,
                startTime,
                endTime,
                notes: notes || undefined,
            })
            revalidatePath(`/items/${id}`)
        })
    }

    async function borrowAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
        "use server"
        return runAction(async () => {
            const session = await getSession()
            if (!session) {
                return
            }
            const ids = formData.getAll("ids") as string[]
            const endTime = new Date(formData.get("returnBy") as string).getTime()

            // Per this repo's design: "borrow" is implemented as
            // create-reservation-then-BorrowFromSchedule, even for an
            // immediate borrow, so it goes through ScheduleTable.create's
            // existing double-booking validation rather than a raw borrow
            // call that could silently conflict with an existing reservation.
            const scheduleId = await createReservation(session.idToken, {
                ids,
                borrower: session.sub,
                startTime: Date.now(),
                endTime,
            })
            await borrowFromSchedule(session.idToken, { scheduleId })
            revalidatePath(`/items/${id}`)
        })
    }

    async function updateFamilyAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
        "use server"
        return runAction(async () => {
            const session = await getSession()
            if (!session) {
                return
            }
            const familyId = formData.get("id") as string
            const name = formData.get("name") as string
            const description = formData.get("description") as string
            const location = formData.get("location") as string
            await updateItem(session.idToken, { id: familyId, name, description, location })
            revalidatePath(`/items/${familyId}`)
        })
    }

    async function deleteFamilyAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
        "use server"
        return runAction(async () => {
            const session = await getSession()
            if (!session) {
                return
            }
            const familyId = formData.get("id") as string
            // DeleteItem cascades: once the last sub-item in a family is
            // removed, it also deletes the (now-empty) family row -- so
            // looping this across every sub-item id deletes the whole family
            // without a dedicated "delete family" backend API.
            for (const item of items) {
                await deleteItem(session.idToken, { id: item.id })
            }
            revalidatePath("/browse")
            redirect("/browse")
        })
    }

    async function addSubItemAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
        "use server"
        return runAction(async () => {
            const session = await getSession()
            if (!session) {
                return
            }
            const friendlyName = formData.get("friendlyName") as string
            const notes = formData.get("notes") as string
            await addItem(session.idToken, {
                name: main.name,
                friendlyName: friendlyName || undefined,
                notes: notes || undefined,
            })
            revalidatePath(`/items/${id}`)
        })
    }

    async function updateSubItemAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
        "use server"
        return runAction(async () => {
            const session = await getSession()
            if (!session) {
                return
            }
            const itemId = formData.get("id") as string
            const name = formData.get("name") as string
            const notes = formData.get("notes") as string
            await updateSubItem(session.idToken, { id: itemId, name, notes })
            revalidatePath(`/items/${id}`)
        })
    }

    async function deleteSubItemAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
        "use server"
        return runAction(async () => {
            const session = await getSession()
            if (!session) {
                return
            }
            const itemId = formData.get("id") as string
            await deleteItem(session.idToken, { id: itemId })
            // If this was the family's last item, DeleteItem's cascade
            // already removed the family row too -- /items/[id] itself is
            // no longer valid, so redirect instead of revalidating in place.
            if (items.length === 1) {
                revalidatePath("/browse")
                redirect("/browse")
            }
            revalidatePath(`/items/${id}`)
        })
    }

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>
                        {main.name} {main.type === "room" && <Badge>Room</Badge>}
                    </h1>
                    <p className={styles.description}>{main.description}</p>
                </div>
                <FamilyHeaderActions
                    main={main}
                    itemCount={items.length}
                    updateFamilyAction={updateFamilyAction}
                    deleteFamilyAction={deleteFamilyAction}
                    addSubItemAction={addSubItemAction}
                />
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
            </Card>

            <ResourceBasket
                familyId={main.id}
                familyName={main.name}
                items={items}
                isRoom={main.type === "room"}
                borrowAction={borrowAction}
                reserveAction={reserveAction}
                updateSubItemAction={updateSubItemAction}
                deleteSubItemAction={deleteSubItemAction}
            />
        </div>
    )
}
