import styles from "./Tabs.module.css"

export function TabList({ children }: { children: React.ReactNode }) {
    return <div className={styles.tabList}>{children}</div>
}

export function Tab({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
    return (
        <a href={href} className={[styles.tab, active ? styles.tabActive : ""].filter(Boolean).join(" ")}>
            {children}
        </a>
    )
}
