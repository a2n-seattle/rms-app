const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

export interface TimeRange {
    start: Date
    end: Date
}

/** Default return-by time for an immediate borrow: 24h from now. */
export function getBorrowByDefault(): Date {
    return new Date(Date.now() + DAY_MS)
}

/** Default start/end for a reservation: start now, end 24h after start. */
export function getReserveDefaults(): TimeRange {
    const start = new Date(Date.now())
    return { start, end: new Date(start.getTime() + DAY_MS) }
}

/** Formats a Date for a `datetime-local` input's value, in local time. */
export function toLocalInputValue(d: Date): string {
    const offsetMs = d.getTimezoneOffset() * 60 * 1000
    return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16)
}
