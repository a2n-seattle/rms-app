"use client"

import { useEffect } from "react"
import styles from "./Modal.module.css"

interface ModalProps {
    open: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
}

/**
 * Generic backdrop + panel primitive -- no Modal/Dialog existed anywhere in
 * this codebase before GH-360's cart/one-click-action prompts needed one.
 */
export function Modal({ open, onClose, title, children }: ModalProps) {
    useEffect(() => {
        if (!open) {
            return
        }
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                onClose()
            }
        }
        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [open, onClose])

    if (!open) {
        return null
    }

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div
                className={styles.panel}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.header}>
                    {title && <h2 className={styles.title}>{title}</h2>}
                    <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </div>
                {children}
            </div>
        </div>
    )
}
