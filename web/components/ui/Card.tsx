import styles from "./Card.module.css"

export function Card({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={[styles.card, className].filter(Boolean).join(" ")} {...rest} />
}
