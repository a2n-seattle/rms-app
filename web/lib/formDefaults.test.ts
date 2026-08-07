import { getBorrowByDefault, getReserveDefaults, toLocalInputValue } from "./formDefaults"

const FIXED_NOW = new Date("2026-03-01T12:00:00.000Z").getTime()

beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(FIXED_NOW)
})

afterEach(() => {
    jest.restoreAllMocks()
})

test("getBorrowByDefault returns 24h from now", () => {
    expect(getBorrowByDefault().getTime()).toEqual(FIXED_NOW + 24 * 60 * 60 * 1000)
})

test("getReserveDefaults returns start=now, end=start+24h", () => {
    const { start, end } = getReserveDefaults()
    expect(start.getTime()).toEqual(FIXED_NOW)
    expect(end.getTime()).toEqual(start.getTime() + 24 * 60 * 60 * 1000)
})

test("toLocalInputValue formats in local time, not UTC", () => {
    const d = new Date(2026, 2, 1, 9, 30) // local March 1 2026, 09:30 -- constructed from local components
    expect(toLocalInputValue(d)).toEqual("2026-03-01T09:30")
})
