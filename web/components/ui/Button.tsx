import styles from "./Button.module.css"

type ButtonVariant = "primary" | "secondary" | "danger"

export function Button({
    variant = "primary",
    className,
    ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
    const variantClass = variant === "primary" ? "" : styles[variant]
    return <button className={[styles.button, variantClass, className].filter(Boolean).join(" ")} {...rest} />
}
