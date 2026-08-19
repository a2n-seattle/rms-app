import { getSession } from "@/lib/session"

/**
 * Minimal diagnostic page for GH-395 -- no data fetching, no client
 * components beyond what the shared protected layout already renders.
 * Used to test whether the `tableName: null` crash is specific to
 * dashboard/page.tsx's complexity or hits any dynamic route under this
 * layout. Remove once GH-395 is resolved or the platform-side cause is
 * confirmed via AWS Support.
 */
export default async function HealthCheckPage() {
    const session = await getSession()
    return <p>Hello, {session?.email ?? "stranger"}.</p>
}
