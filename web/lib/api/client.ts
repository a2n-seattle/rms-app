import outputs from "@/amplify_outputs.json"

// `custom.apiUrl` comes from amplify/backend.ts's backend.addOutput(...) --
// ampx generate outputs doesn't surface a custom RestApi's URL any other way.
const API_BASE_URL = (outputs as { custom?: { apiUrl?: string } }).custom?.apiUrl

/**
 * Calls the RMS API Gateway server-to-server, attaching the caller's raw
 * Cognito ID token (no "Bearer" prefix, matching this API's
 * CognitoUserPoolsAuthorizer). Server-only -- never call from a "use
 * client" component; the browser only ever talks to this app's own
 * Server Actions/Route Handlers, never API Gateway directly (no CORS is
 * configured on that API by design).
 */
export async function callRmsApi<TInput, TResult>(path: string, idToken: string, input: TInput): Promise<TResult> {
    if (!API_BASE_URL) {
        throw new Error("Missing custom.apiUrl in amplify_outputs.json")
    }

    const response = await fetch(new URL(path, API_BASE_URL), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: idToken,
        },
        body: JSON.stringify(input),
        cache: "no-store",
    })

    const body = await response.json()
    if (!response.ok) {
        throw new Error(body.error ?? `RMS API request to ${path} failed with status ${response.status}`)
    }

    return body as TResult
}
