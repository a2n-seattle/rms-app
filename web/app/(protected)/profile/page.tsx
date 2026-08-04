"use client"

import { useState } from "react"
import { updateUserAttributes, fetchAuthSession } from "aws-amplify/auth"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
    const router = useRouter()
    const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setStatus("saving")
        setError(null)
        try {
            await updateUserAttributes({ userAttributes: { name: formData.get("name") as string } })
            // updateUserAttributes only changes the Cognito record -- the
            // ID token (source of the nav's session.name, read server-side
            // via getSession()) is cached at issue time. forceRefresh
            // writes a fresh token into the shared SSR cookie store
            // (Amplify.configure(outputs, { ssr: true }) in
            // ConfigureAmplify.tsx puts client-side Auth on cookie storage
            // specifically so client and server share one token source),
            // then router.refresh() re-renders the Server Component nav.
            await fetchAuthSession({ forceRefresh: true })
            setStatus("saved")
            router.refresh()
        } catch (e) {
            setStatus("error")
            setError(e instanceof Error ? e.message : "Failed to update name")
        }
    }

    return (
        <div>
            <h1>Profile</h1>
            <form action={handleSubmit}>
                <label>
                    Name: <input type="text" name="name" required />
                </label>
                <button type="submit" disabled={status === "saving"}>
                    Save
                </button>
            </form>
            {status === "saved" && <p>Saved.</p>}
            {status === "error" && <p>{error}</p>}
        </div>
    )
}
