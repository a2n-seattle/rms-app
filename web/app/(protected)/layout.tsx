import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const session = await getSession()
    if (!session) {
        redirect("/login")
    }

    return (
        <div>
            <nav style={{ display: "flex", gap: "1rem", padding: "1rem", borderBottom: "1px solid #ccc" }}>
                <a href="/browse">Browse</a>
                <a href="/reservations">Reservations</a>
                <a href="/profile">Profile</a>
                <span>{session.name || session.email}</span>
            </nav>
            <main style={{ padding: "1rem" }}>{children}</main>
        </div>
    )
}
