"use client"

import { signOut } from "aws-amplify/auth"
import { useRouter } from "next/navigation"

export function SignOutButton() {
    const router = useRouter()

    async function handleSignOut() {
        await signOut()
        router.push("/login")
    }

    return <button onClick={handleSignOut}>Sign out</button>
}
