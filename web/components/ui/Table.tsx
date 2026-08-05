import styles from "./Table.module.css"

export function Table({ className, ...rest }: React.TableHTMLAttributes<HTMLTableElement>) {
    return <table className={[styles.table, className].filter(Boolean).join(" ")} {...rest} />
}
