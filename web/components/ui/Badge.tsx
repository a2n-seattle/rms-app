import styles from "./Badge.module.css"

type BadgeVariant = "default" | "warning" | "danger"

export function Badge({
    variant = "default",
    className,
    ...rest
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
    const variantClass = variant === "default" ? "" : styles[variant]
    return <span className={[styles.badge, variantClass, className].filter(Boolean).join(" ")} {...rest} />
}
