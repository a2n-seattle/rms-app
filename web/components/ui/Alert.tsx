import styles from "./Alert.module.css"

type AlertVariant = "success" | "error"

export function Alert({
    variant,
    children,
    className,
    ...rest
}: React.HTMLAttributes<HTMLDivElement> & { variant: AlertVariant }) {
    return (
        <div
            className={[styles.alert, styles[variant], className].filter(Boolean).join(" ")}
            role={variant === "error" ? "alert" : "status"}
            {...rest}
        >
            {children}
        </div>
    )
}
