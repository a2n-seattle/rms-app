"use client"

import { signInWithRedirect } from "aws-amplify/auth"
import { Hub } from "aws-amplify/utils"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function LoginPage() {
    const router = useRouter()

    useEffect(() => {
        // Real users only ever see this Google button -- no password form
        // exists on this page at all. @aws-amplify/ui-react's <Authenticator>
        // has no documented way to hide the password form while keeping
        // social providers, so this page calls signInWithRedirect directly
        // instead of using it. (A separate, unlinked /test-login route
        // exists for e2e testing only -- see web/app/test-login/page.tsx.)
        const hubListener = Hub.listen("auth", ({ payload }) => {
            if (payload.event === "signInWithRedirect") {
                router.replace("/browse")
            }
        })
        return hubListener
    }, [router])

    return (
        <div>
            <h1>RMS</h1>
            <button onClick={() => signInWithRedirect({ provider: "Google" })}>Sign in with Google</button>
        </div>
    )
}
