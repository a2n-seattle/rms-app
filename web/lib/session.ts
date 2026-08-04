import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "./amplify-server-utils"
import { cookies } from "next/headers"

export interface RmsSession {
    idToken: string
    email: string
    name: string
}

/**
 * Server-only helper: raw Cognito ID token (no `Bearer` prefix, matching
 * this API's CognitoUserPoolsAuthorizer) plus the decoded email/name
 * claims, for use in Server Components/Actions. Returns null when signed out.
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
            }
        },
    })
}
