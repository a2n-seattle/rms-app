import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/session"
import { SignOutButton } from "@/components/SignOutButton"
import { CartProvider } from "@/lib/cart/CartContext"
import { CartBadge } from "@/components/ui/CartBadge"
import themeStyles from "@/components/ui/theme.module.css"
import styles from "./protected-layout.module.css"

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const session = await getSession()
    if (!session) {
        redirect("/login")
    }

    return (
        <div className={themeStyles.appShell}>
            <CartProvider>
                <nav className={styles.nav}>
                    <div className={styles.navLinks}>
                        <a href="/dashboard" className={styles.navLink}>
                            Dashboard
                        </a>
                        <a href="/browse" className={styles.navLink}>
                            Browse
                        </a>
                        <Link href="/batches" className={styles.navLink}>
                            Batches
                        </Link>
                    </div>
                    <span className={styles.userInfo}>{session.name || session.email}</span>
                    <SignOutButton />
                </nav>
                <main className={styles.main}>{children}</main>
                <CartBadge />
            </CartProvider>
        </div>
    )
}
