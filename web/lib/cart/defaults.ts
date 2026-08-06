const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

export interface TimeRange {
    start: Date
    end: Date
}

/**
 * Minimal stand-in for issue #355 (borrow/return time defaults) -- simple
 * fixed offsets, not smart/learned defaults. Every field remains editable
 * in the UI; these are just sensible starting points instead of blank
 * inputs.
 */
export function getBorrowDefaults(): TimeRange {
    const now = Date.now()
    return { start: new Date(now), end: new Date(now + DAY_MS) }
}

export function getReserveDefaults(): TimeRange {
    const now = Date.now()
    return { start: new Date(now + HOUR_MS), end: new Date(now + DAY_MS) }
}

/** Formats a Date for a `datetime-local` input's value, in local time. */
export function toLocalInputValue(d: Date): string {
    const offsetMs = d.getTimezoneOffset() * 60 * 1000
    return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16)
}
