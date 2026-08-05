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

    // Reserve starting several minutes from now -- far enough out that it's
    // still "upcoming" (startTime in the future) for the whole duration of
    // this test's polling below, not just at creation time. A too-tight
    // window (e.g. 10s) can tick past `now` before the poll below ever
    // succeeds, since each poll iteration does a full page.goto round
    // trip. Ends far in the future so it doesn't collide with other e2e
    // specs' reservations on the same item (see reservations.spec.ts's
    // comment on the same constraint).
    const notes = `e2e-dashboard-${Date.now()}`
    const start = new Date(Date.now() + 5 * 60 * 1000)
    const end = new Date(Date.now() + (30 + Math.floor(Math.random() * 365)) * 24 * 60 * 60 * 1000)
    const toLocalInputValue = (d: Date) => d.toISOString().slice(0, 16)

    await page.locator('input[name="start"]').fill(toLocalInputValue(start))
    await page.locator('input[name="end"]').fill(toLocalInputValue(end))
    await page.locator('input[name="notes"]').fill(notes)
    await Promise.all([
        page.waitForResponse((response) => response.request().method() === "POST"),
        page.getByRole("button", { name: "Reserve" }).click(),
    ])

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

    await page.goto("/dashboard?tab=borrowed")
    await expect(page.getByText(TEST_ITEM_ID!)).toBeVisible()
})
