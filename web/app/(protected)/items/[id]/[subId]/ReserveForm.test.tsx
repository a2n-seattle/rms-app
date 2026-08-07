import { render, screen } from "@testing-library/react"
import { ReserveForm } from "./ReserveForm"

const FIXED_NOW = new Date("2026-03-01T12:00:00.000Z").getTime()

beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(FIXED_NOW)
})

afterEach(() => {
    jest.restoreAllMocks()
})

test("pre-fills start with now and end with start + 24h", () => {
    render(<ReserveForm reserveAction={jest.fn()} />)

    const start = screen.getByLabelText("Start") as HTMLInputElement
    const end = screen.getByLabelText("End") as HTMLInputElement

    expect(new Date(start.value).getTime()).toEqual(FIXED_NOW)
    expect(new Date(end.value).getTime()).toEqual(FIXED_NOW + 24 * 60 * 60 * 1000)
})
