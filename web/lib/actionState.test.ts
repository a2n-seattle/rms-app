import { redirect } from "next/navigation"
import { runAction } from "./actionState"

test("resolves { success: true } when the wrapped function completes cleanly", async () => {
    await expect(runAction(async () => {})).resolves.toEqual({ success: true })
})

test("resolves { success: false, error: message } when the wrapped function throws an Error", async () => {
    await expect(
        runAction(async () => {
            throw new Error("Unable to borrow item: Item is currently being borrowed by 'someone-else'.")
        })
    ).resolves.toEqual({
        success: false,
        error: "Unable to borrow item: Item is currently being borrowed by 'someone-else'.",
    })
})

test("falls back to a generic message when a non-Error value is thrown", async () => {
    const throwNonError = async (): Promise<void> => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error -- deliberately testing the non-Error fallback path
        throw "not an Error instance"
    }

    await expect(runAction(throwNonError)).resolves.toEqual({ success: false, error: "Something went wrong." })
})

test("rethrows Next's internal redirect control-flow error instead of swallowing it", async () => {
    // next/navigation's redirect() works by throwing a special digest-tagged Error --
    // unstable_rethrow must let this propagate, or a successful action that redirects
    // (e.g. return-group/[groupId]/page.tsx) would silently stop navigating.
    let caughtDigest: string | undefined

    try {
        await runAction(async () => {
            redirect("/dashboard?tab=borrowed")
        })
    } catch (err) {
        caughtDigest = (err as { digest?: string }).digest
    }

    expect(caughtDigest).toMatch(/^NEXT_REDIRECT/)
})
