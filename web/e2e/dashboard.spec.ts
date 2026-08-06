import { test, expect } from "@playwright/test"
import { cleanupReturn, isBorrowed, waitVisible } from "./cleanup"

/**
 * Dashboard: login -> reserve the test item -> see it as an "Upcoming"
 * alert and under the Scheduled tab -> Borrow it from the alert -> see
 * it disappear from the alert and show up under Currently Borrowed.
 * Run against the real deployed `alpha` environment (same philosophy as
 * golden-path.spec.ts). Reuses the same test fixtures -- no new secret
 * needed.
 */
const TEST_EMAIL = process.env.RMS_TEST_USER_EMAIL
const TEST_PASSWORD = process.env.RMS_TEST_USER_PASSWORD
const TEST_ITEM_ID = process.env.RMS_TEST_ITEM_ID

test.skip(!TEST_EMAIL || !TEST_PASSWORD || !TEST_ITEM_ID, "Missing RMS_TEST_USER_EMAIL/RMS_TEST_USER_PASSWORD/RMS_TEST_ITEM_ID")

test("reserve, see upcoming alert, borrow from it, see it under Currently Borrowed", async ({ page }) => {
    await page.goto("/test-login")
    await page.getByLabel("Email:").fill(TEST_EMAIL!)
    await page.getByLabel("Password:").fill(TEST_PASSWORD!)
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page).toHaveURL(/\/browse/)

    await page.goto(`/items/${encodeURIComponent(TEST_ITEM_ID!)}`)

    // Reserve starting far in the future (30-395 days out, matching
    // reservations.spec.ts's proven randomization range) rather than a few
    // minutes from now. A tight offset range combined with a 1-hour window
    // means Playwright's automatic retry -- which re-runs this whole test,
    // creating a *second* reservation within seconds of the first's
    // leftover one if an assertion after creation fails -- has a very high
    // chance of drawing an overlapping random start on retry, since only a
    // handful of non-overlapping 1-hour slots exist in a ~60-minute range.
    // That's what actually caused this test to fail in CI: CreateReservation
    // legitimately 400s on the overlap. As of GH-356, reserveAction catches
    // that and returns an inline error instead of crashing (see
    // borrow-conflict.spec.ts for a dedicated test of that path) -- this
    // test still avoids the collision entirely via the wide 30-395 day
    // spread, since a caught-and-displayed conflict is still a failed
    // reservation as far as this test's own assertions are concerned. Still
    // "upcoming" either way, since only startTime > now matters for that.
    const notes = `e2e-dashboard-${Date.now()}`
    const offsetDays = 30 + Math.floor(Math.random() * 365)
    const start = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    const toLocalInputValue = (d: Date) => d.toISOString().slice(0, 16)

    await page.locator('input[name="start"]').fill(toLocalInputValue(start))
    await page.locator('input[name="end"]').fill(toLocalInputValue(end))
    await page.locator('input[name="notes"]').fill(notes)
    // Fail loudly on a rejected reservation (e.g. a genuine overlap with
    // another leftover reservation) instead of silently polling for an
    // "Upcoming" alert that was never actually created. Note: a Server
    // Action's POST response body is Next.js's internal RSC "flight" wire
    // format, not plain JSON returned by the action -- do not attempt to
    // `.json()`/read the action's return value from it, only use `.ok()`.
    const [createResponse] = await Promise.all([
        page.waitForResponse((response) => response.request().method() === "POST"),
        page.getByRole("button", { name: "Reserve" }).click(),
    ])
    expect(createResponse.ok(), `create-reservation failed with status ${createResponse.status()}`).toBe(true)

    // try/finally from here on: a failed assertion must not leave this run's own reservation
    // (or, if borrowed, the item itself) stuck for every later spec sharing this fixture.
    // The unique `notes` text scopes every locator below to *this* run's own alert/row,
    // instead of an ambiguous role/text query that breaks the moment more than one
    // "Upcoming" reservation exists on the shared test item (accumulated leftovers from
    // other specs/retries are common here).
    try {
        // ListUpcomingReservations scans+filters, eventually consistent --
        // poll rather than assert once (same caveat as reservations.spec.ts).
        const alert = page.locator('[data-testid="upcoming-alert"]', { hasText: notes })
        await expect
            .poll(
                async () => {
                    await page.goto("/dashboard")
                    return alert.isVisible()
                },
                { timeout: 15000, intervals: [2000] }
            )
            .toBe(true)

        await Promise.all([
            page.waitForResponse((response) => response.request().method() === "POST"),
            alert.getByRole("button", { name: "Borrow" }).click(),
        ])

        // ListMyBorrowedItems scans+filters, eventually consistent -- poll rather than
        // assert once (same caveat as the "Upcoming" alert poll above). Match by the row's
        // link href, not display text -- the borrowed-tab row shows the item's friendly
        // `name` (e.g. "E2E Test Chair"), not its raw id, since GH-353.
        await expect
            .poll(
                async () => {
                    await page.goto("/dashboard?tab=borrowed")
                    return page.locator(`a[href="/items/${encodeURIComponent(TEST_ITEM_ID!)}"]`).isVisible()
                },
                { timeout: 15000, intervals: [2000] }
            )
            .toBe(true)
    } finally {
        // Whether the borrow above succeeded, failed, or an assertion threw: if the item ended
        // up borrowed, return it so it doesn't stay unusable for every other spec/run. If the
        // reservation is still just pending (borrow never happened), cancel it via its
        // notes-scoped alert instead of leaving it to accumulate.
        await page.goto(`/items/${encodeURIComponent(TEST_ITEM_ID!)}`)
        if (await isBorrowed(page)) {
            await cleanupReturn(page)
        } else {
            await page.goto("/dashboard")
            const alert = page.locator('[data-testid="upcoming-alert"]', { hasText: notes })
            const cancelButton = alert.getByRole("button", { name: "Cancel" })
            if (await waitVisible(cancelButton)) {
                await cancelButton.click()
            }
        }
    }

    await expect
        .poll(
            async () => {
                await page.goto(`/items/${encodeURIComponent(TEST_ITEM_ID!)}`)
                return page.getByText("(available)").isVisible()
            },
            { timeout: 15000, intervals: [2000] }
            )
        .toBe(true)
})
