import { NextRequest, NextResponse } from "next/server"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "./lib/amplify-server-utils"

export async function proxy(request: NextRequest) {
    const response = NextResponse.next()

    const authenticated = await runWithAmplifyServerContext({
        nextServerContext: { request, response },
        operation: async (contextSpec) => {
            const session = await fetchAuthSession(contextSpec)
            return session.tokens?.idToken !== undefined
        },
    })

    if (!authenticated) {
        return NextResponse.redirect(new URL("/login", request.url))
    }

    return response
}

export const config = {
    matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
}
