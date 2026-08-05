import { unstable_rethrow } from "next/navigation"

export interface ActionState {
    success: boolean
    error?: string
}

export const initialActionState: ActionState = { success: false }

/**
 * Wraps a Server Action body: on success, resolves { success: true }; on a thrown Error,
 * resolves { success: false, error: message } instead of letting it propagate to Next's
 * generic RSC error boundary. `unstable_rethrow` must run first in the catch block -- Next's
 * `redirect()`/`notFound()` work by throwing a special digest-tagged error, and swallowing
 * that here would silently break navigation instead of just suppressing a real error.
 */
export async function runAction(fn: () => Promise<void>): Promise<ActionState> {
    try {
        await fn()
        return { success: true }
    } catch (err) {
        unstable_rethrow(err)
        return { success: false, error: err instanceof Error ? err.message : "Something went wrong." }
    }
}
