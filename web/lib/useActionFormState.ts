"use client"

import { useEffect } from "react"
import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { ActionState, initialActionState } from "./actionState"

/**
 * useActionState + router.refresh() on success, so a Server Action that
 * completes without redirecting shows fresh server-rendered data immediately.
 * Amplify Hosting doesn't support Next's on-demand revalidation
 * (revalidatePath/revalidateTag -- see GH-395); router.refresh() re-requests
 * the current route's RSC payload directly instead. redirect()-based actions
 * never resolve here (redirect throws internally, per runAction's
 * unstable_rethrow), so this is safe to use on every action uniformly,
 * including ones that only sometimes redirect.
 */
export function useActionFormState(
    action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
) {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(action, initialActionState)

    useEffect(() => {
        if (state.success) {
            router.refresh()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state])

    return [state, formAction, isPending] as const
}
