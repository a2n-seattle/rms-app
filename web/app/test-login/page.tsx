"use client"

import { signIn } from "aws-amplify/auth"
import { useRouter } from "next/navigation"
import { useState } from "react"

/**
 * Email/password sign-in for e2e testing only (rms.test@acts2.network) --
 * never linked from anywhere in the real UI. The production login page
 * (web/app/login/page.tsx) is Google-only; Google's redirect flow isn't
 * automatable in CI, so tests sign in here instead.
 *
 * This page IS present in the deployed build and reachable if someone
 * knows/guesses the URL -- it's unlinked, not access-controlled. That's
 * an accepted tradeoff: no real user has a Cognito password (accounts are
 * only ever created via Google federation, restricted to acts2.network by
 * ts-code/src/handlers/auth/PreSignUp.ts), so there's nothing for anyone
 * but the one deliberately-provisioned test account to sign in with here,
 * even though Cognito's loginWith.email stays enabled at the pool level.
 */
export default function TestLoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        try {
            await signIn({ username: email, password })
            router.replace("/dashboard")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Sign in failed")
        }
    }

    return (
        <div>
            <h1>Test sign-in</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    Email: <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
                <label>
                    Password: <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </label>
                <button type="submit">Sign in</button>
                {error && <p>{error}</p>}
            </form>
        </div>
    )
}
