"use client"

import { Authenticator } from "@aws-amplify/ui-react"
import "@aws-amplify/ui-react/styles.css"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

function RedirectAfterSignIn() {
    const router = useRouter()

    useEffect(() => {
        router.replace("/browse")
    }, [router])

    return null
}

export default function LoginPage() {
    return <Authenticator socialProviders={["google"]}>{() => <RedirectAfterSignIn />}</Authenticator>
}
