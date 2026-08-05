"use client"

import { signOut } from "aws-amplify/auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"

export function SignOutButton() {
    const router = useRouter()

    async function handleSignOut() {
        await signOut()
        router.push("/login")
    }

    return (
        <Button variant="secondary" onClick={handleSignOut}>
            Sign out
        </Button>
    )
}
