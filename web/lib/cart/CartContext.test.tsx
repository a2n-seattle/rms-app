import { renderHook, act } from "@testing-library/react"
import { CartProvider, useCart, CartEntry } from "./CartContext"

const CHAIR: CartEntry = { itemId: "chair-1", familyId: "chairs", itemName: "Chair 1", familyName: "Chairs" }
const PROJECTOR: CartEntry = { itemId: "proj-1", familyId: "projectors", itemName: "Projector 1", familyName: "Projectors" }

function renderCart() {
    return renderHook(() => useCart(), { wrapper: CartProvider })
}

test("starts empty", () => {
    const { result } = renderCart()
    expect(result.current.entries).toEqual([])
    expect(result.current.count).toBe(0)
})

test("addEntries adds new entries and de-dupes by itemId", () => {
    const { result } = renderCart()

    act(() => result.current.addEntries([CHAIR, PROJECTOR]))
    expect(result.current.count).toBe(2)

    act(() => result.current.addEntries([{ ...CHAIR, itemName: "Renamed Chair" }]))
    expect(result.current.count).toBe(2)
    expect(result.current.entries.find((e) => e.itemId === "chair-1")?.itemName).toBe("Renamed Chair")
})

test("removeEntry removes a single entry", () => {
    const { result } = renderCart()
    act(() => result.current.addEntries([CHAIR, PROJECTOR]))

    act(() => result.current.removeEntry("chair-1"))

    expect(result.current.entries.map((e) => e.itemId)).toEqual(["proj-1"])
})

test("removeFamily removes every entry from that family", () => {
    const { result } = renderCart()
    const CHAIR_2: CartEntry = { itemId: "chair-2", familyId: "chairs", itemName: "Chair 2", familyName: "Chairs" }
    act(() => result.current.addEntries([CHAIR, CHAIR_2, PROJECTOR]))

    act(() => result.current.removeFamily("chairs"))

    expect(result.current.entries.map((e) => e.itemId)).toEqual(["proj-1"])
})

test("clear empties the cart", () => {
    const { result } = renderCart()
    act(() => result.current.addEntries([CHAIR, PROJECTOR]))

    act(() => result.current.clear())

    expect(result.current.count).toBe(0)
})

test("useCart throws when used outside a CartProvider", () => {
    // Suppress the expected React error boundary console.error noise for this one test.
    const spy = jest.spyOn(console, "error").mockImplementation(() => {})
    expect(() => renderHook(() => useCart())).toThrow("useCart must be used within a CartProvider")
    spy.mockRestore()
})
