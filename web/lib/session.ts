import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "./amplify-server-utils"
import { cookies } from "next/headers"

export interface RmsSession {
    idToken: string
    email: string
    name: string
    sub: string
}

/**
 * Server-only helper: raw Cognito ID token (no `Bearer` prefix, matching
 * this API's CognitoUserPoolsAuthorizer) plus the decoded email/name/sub
 * claims, for use in Server Components/Actions. Returns null when signed out.
 *
 * `sub` (not `email`) is the canonical borrower identity threaded through
 * borrow/return/reserve calls (GH-353) -- it's a stable Cognito user id,
 * already present on the token with no extra lookup, unlike resolving a
 * display name (which does require a Cognito API call -- see GetItem's
 * server-side ownerDisplayName/borrowerDisplayNames resolution).
 */
export async function getSession(): Promise<RmsSession | null> {
    return runWithAmplifyServerContext({
        nextServerContext: { cookies },
        operation: async (contextSpec) => {
            const session = await fetchAuthSession(contextSpec)
            const idToken = session.tokens?.idToken
            if (!idToken) {
                return null
            }

            return {
                idToken: idToken.toString(),
                email: (idToken.payload.email as string) ?? "",
                name: (idToken.payload.name as string) ?? "",
                sub: (idToken.payload.sub as string) ?? "",
            }
        },
    })
}
