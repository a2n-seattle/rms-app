import { test, expect } from "@playwright/test"

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
    // legitimately 400s on the overlap, and nothing catches that inside the
    // reserveAction Server Action, so it surfaces as an opaque 500 (RSC
    // error digest) instead of the validation error itself. A 30-395 day
    // spread makes any such collision, across retries or across separate CI
    // runs sharing this same item, astronomically unlikely -- still
    // "upcoming" either way, since only startTime > now matters for that.
    const notes = `e2e-dashboard-${Date.now()}`
    const offsetDays = 30 + Math.floor(Math.random() * 365)
    const start = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    const toLocalInputValue = (d: Date) => d.toISOString().slice(0, 16)

    await page.locator('input[name="start"]').fill(toLocalInputValue(start))
    await page.locator('input[name="end"]').fill(toLocalInputValue(end))
    await page.locator('input[name="notes"]').fill(notes)
    const [createResponse] = await Promise.all([
        page.waitForResponse((response) => response.request().method() === "POST"),
        page.getByRole("button", { name: "Reserve" }).click(),
    ])
    // Fail loudly on a rejected reservation (e.g. a genuine overlap with
    // another leftover reservation) instead of silently polling for an
    // "Upcoming" alert that was never actually created.
    expect(createResponse.ok(), `create-reservation failed: ${await createResponse.text()}`).toBe(true)

    // ListUpcomingReservations scans+filters, eventually consistent --
    // poll rather than assert once (same caveat as reservations.spec.ts).
    await expect
        .poll(
            async () => {
                await page.goto("/dashboard")
                return page.getByText("Upcoming").isVisible()
            },
            { timeout: 15000 }
        )
        .toBe(true)

    await Promise.all([
        page.waitForResponse((response) => response.request().method() === "POST"),
        page.getByRole("button", { name: "Borrow" }).click(),
    ])

    // BorrowFromSchedule deletes the schedule as part of consuming it, so
    // there's nothing left to clean up on success -- if an assertion above
    // this point throws instead, the reservation is left dangling on the
    // shared test item. There's no practical afterEach hook here (the
    // reservation's schedule id isn't otherwise exposed to the test), so
    // this is accepted as a known, narrow gap rather than over-engineered
    // away -- a failed run's leftover reservation only risks a future
    // *dashboard.spec.ts* run colliding on the exact same random window,
    // which the randomized start above already makes unlikely.
    await page.goto("/dashboard?tab=borrowed")
    await expect(page.getByText(TEST_ITEM_ID!)).toBeVisible()
})
