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
    // test-login is excluded too -- a separate, unlinked page used only by
    // e2e tests (web/app/test-login/page.tsx) for email/password sign-in,
    // since the real /login page is Google-only. Needs to be reachable
    // while unauthenticated, same as /login.
    matcher: ["/((?!login|test-login|api/auth|_next/static|_next/image|favicon.ico).*)"],
}
