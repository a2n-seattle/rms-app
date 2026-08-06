"use server"

import { getSession } from "@/lib/session"
import { getItem } from "@/lib/api/getItem"
import { createReservation } from "@/lib/api/createReservation"
import { borrowFromSchedule } from "@/lib/api/borrowFromSchedule"
import { returnItem } from "@/lib/api/returnItem"
import { revalidatePath } from "next/cache"
import { ActionState, runAction } from "@/lib/actionState"

/**
 * Every other Server Action in this app is defined inline inside a page.tsx
 * Server Component and passed down as a prop (see items/[id]/page.tsx's
 * borrowAction/reserveAction). That doesn't work for the cart: its badge and
 * checkout modal are mounted globally in the protected layout, not scoped to
 * one page's server-rendered props, so these live in their own "use server"
 * file instead -- Client Components can import and call them directly.
 */

export interface AvailableItem {
    id: string
    name: string
}

/**
 * Resolves a family's currently-available sub-items on demand. Called only
 * when a user actually checks a row / opens a one-click prompt -- never
 * eagerly for a whole list page, since this repo's DynamoDB tables are
 * deliberately provisioned at 1 RCU/1 WCU (see root CLAUDE.md).
 */
export async function resolveFamilyAvailability(familyId: string): Promise<{ items: AvailableItem[]; total: number }> {
    const session = await getSession()
    if (!session) {
        return { items: [], total: 0 }
    }
    const { items } = await getItem(session.idToken, { key: familyId })
    return {
        items: items.filter((item) => item.borrower === "").map((item) => ({ id: item.id, name: item.name })),
        total: items.length,
    }
}

/**
 * Shared by the cart checkout modal and the one-click Borrow/Reserve
 * prompt -- both submit the exact same shape (a flat list of item ids plus
 * a mode and time range). Mirrors items/[id]/page.tsx's existing
 * borrowAction/reserveAction: borrow still goes through
 * create-reservation-then-borrow-from-schedule so it routes through
 * ScheduleTable.create's double-booking validation rather than a raw
 * borrow call.
 */
export async function submitBorrowOrReserve(_prevState: ActionState, formData: FormData): Promise<ActionState> {
    return runAction(async () => {
        const session = await getSession()
        if (!session) {
            return
        }
        const ids = formData.getAll("ids") as string[]
        const mode = formData.get("mode") as "borrow" | "reserve"
        const notes = (formData.get("notes") as string) || undefined

        if (mode === "borrow") {
            const endTime = new Date(formData.get("returnBy") as string).getTime()
            const scheduleId = await createReservation(session.idToken, {
                ids,
                borrower: session.sub,
                startTime: Date.now(),
                endTime,
                notes,
            })
            await borrowFromSchedule(session.idToken, { scheduleId })
        } else {
            const startTime = new Date(formData.get("start") as string).getTime()
            const endTime = new Date(formData.get("end") as string).getTime()
            await createReservation(session.idToken, {
                ids,
                borrower: session.sub,
                startTime,
                endTime,
                notes,
            })
        }

        revalidatePath("/browse")
        revalidatePath("/dashboard")
    })
}

/** One-click Return from the browse table -- mirrors return/page.tsx's existing returnAction. */
export async function submitOneClickReturn(_prevState: ActionState, formData: FormData): Promise<ActionState> {
    return runAction(async () => {
        const session = await getSession()
        if (!session) {
            return
        }
        const ids = formData.getAll("ids") as string[]
        const notes = (formData.get("notes") as string) || undefined

        await returnItem(session.idToken, { ids, borrower: session.sub, notes })

        revalidatePath("/browse")
        revalidatePath("/return")
        revalidatePath("/dashboard")
    })
}
