import styles from "./Button.module.css"

type ButtonVariant = "primary" | "secondary" | "danger"

export function ButtonLink({
    variant = "primary",
    className,
    ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: ButtonVariant }) {
    const variantClass = variant === "primary" ? "" : styles[variant]
    return <a className={[styles.button, variantClass, className].filter(Boolean).join(" ")} {...rest} />
}
