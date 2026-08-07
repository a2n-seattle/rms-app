"use client"

import { signInWithRedirect } from "aws-amplify/auth"
import { Hub } from "aws-amplify/utils"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function LoginPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Real users only ever see this Google button -- no password form
        // exists on this page at all. @aws-amplify/ui-react's <Authenticator>
        // has no documented way to hide the password form while keeping
        // social providers, so this page calls signInWithRedirect directly
        // instead of using it. (A separate, unlinked /test-login route
        // exists for e2e testing only -- see web/app/test-login/page.tsx.)
        const hubListener = Hub.listen("auth", ({ payload }) => {
            if (payload.event === "signInWithRedirect") {
                router.replace("/dashboard")
            } else if (payload.event === "signInWithRedirect_failure") {
                // Surfaced because this failure mode was previously
                // silent -- the OAuth redirect would complete and land
                // back on /login with no visible error anywhere (not even
                // the browser console), making it impossible to diagnose.
                setError(payload.data?.error?.message ?? "Google sign-in failed")
            }
        })
        return hubListener
    }, [router])

    return (
        <div>
            <h1>RMS</h1>
            <button onClick={() => signInWithRedirect({ provider: "Google" })}>Sign in with Google</button>
            {error && <p>{error}</p>}
        </div>
    )
}
