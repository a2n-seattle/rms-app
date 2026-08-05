"use client"

import { useActionState } from "react"
import { Alert } from "./Alert"
import { ActionState, initialActionState } from "@/lib/actionState"

interface ActionFormProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "action"> {
    action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
    successMessage: string
    children: React.ReactNode
}

/**
 * Drop-in replacement for a raw `<form action={serverAction}>` -- wraps React's
 * useActionState so every borrow/return/reserve/etc. form gets the same inline
 * success/error feedback instead of an uncaught Server Action error surfacing as
 * Next's generic crash page (see web/lib/actionState.ts's runAction, which every
 * `action` passed here is expected to be built with).
 */
export function ActionForm({ action, successMessage, children, ...formProps }: ActionFormProps) {
    const [state, formAction] = useActionState(action, initialActionState)

    return (
        <form action={formAction} {...formProps}>
            {children}
            {state.error && <Alert variant="error">{state.error}</Alert>}
            {state.success && <Alert variant="success">{successMessage}</Alert>}
        </form>
    )
}
