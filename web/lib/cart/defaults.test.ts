import { getBorrowDefaults, getReserveDefaults, toLocalInputValue } from "./defaults"

const FIXED_NOW = new Date("2027-06-15T12:00:00.000Z").getTime()

beforeEach(() => {
    jest.useFakeTimers().setSystemTime(FIXED_NOW)
})

afterEach(() => {
    jest.useRealTimers()
})

test("getBorrowDefaults starts now, ends 24 hours later", () => {
    const { start, end } = getBorrowDefaults()
    expect(start.getTime()).toBe(FIXED_NOW)
    expect(end.getTime()).toBe(FIXED_NOW + 24 * 60 * 60 * 1000)
})

test("getReserveDefaults starts 1 hour out, ends 1 day after start", () => {
    const { start, end } = getReserveDefaults()
    expect(start.getTime()).toBe(FIXED_NOW + 60 * 60 * 1000)
    expect(end.getTime()).toBe(FIXED_NOW + 24 * 60 * 60 * 1000)
})

test("toLocalInputValue formats to a 16-character datetime-local string", () => {
    const value = toLocalInputValue(new Date(FIXED_NOW))
    expect(value).toHaveLength(16)
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
})
