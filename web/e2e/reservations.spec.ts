import { test, expect } from "@playwright/test"

/**
 * Reservations: login -> reserve the test item -> verify it shows on
 * /reservations, run against the real deployed `alpha` environment (same
 * philosophy as golden-path.spec.ts).
 *
 * Reuses the same test fixtures as golden-path.spec.ts -- no new secret
 * needed:
 *   RMS_TEST_USER_EMAIL, RMS_TEST_USER_PASSWORD, RMS_TEST_ITEM_ID
 */
const TEST_EMAIL = process.env.RMS_TEST_USER_EMAIL
const TEST_PASSWORD = process.env.RMS_TEST_USER_PASSWORD
const TEST_ITEM_ID = process.env.RMS_TEST_ITEM_ID

test.skip(!TEST_EMAIL || !TEST_PASSWORD || !TEST_ITEM_ID, "Missing RMS_TEST_USER_EMAIL/RMS_TEST_USER_PASSWORD/RMS_TEST_ITEM_ID")

test("reserve an item and see it on the reservations page", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Email").fill(TEST_EMAIL!)
    // getByLabel("Password") is ambiguous -- it also matches the
    // Authenticator's "Show password" toggle button, which carries an
    // aria-label containing "Password" too. Scope to the actual textbox.
    await page.getByRole("textbox", { name: "Password" }).fill(TEST_PASSWORD!)
    // Non-exact "Sign in" also matches the Google SSO button ("Sign In
    // with Google icon"); exact: true targets only the submit button.
    await page.getByRole("button", { name: "Sign in", exact: true }).click()

    await expect(page).toHaveURL(/\/browse/)

    await page.goto(`/items/${encodeURIComponent(TEST_ITEM_ID!)}`)
    await expect(page.getByRole("heading", { name: "Reserve this item" })).toBeVisible()

    const notes = `e2e-reservation-${Date.now()}`
    // CreateReservation rejects overlapping windows on the same item
    // (ScheduleTable.create's validateDate check) -- this test doesn't
    // clean up after itself (no delete-reservation call, out of this PR's
    // scope), so a fixed offset from Date.now() would collide with the
    // previous run's leftover reservation on every subsequent run.
    // Randomize far enough out (30-395 days) that collisions across runs
    // are effectively impossible.
    const offsetDays = 30 + Math.floor(Math.random() * 365)
    const start = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    const toLocalInputValue = (d: Date) => d.toISOString().slice(0, 16)

    await page.locator('input[name="start"]').fill(toLocalInputValue(start))
    await page.locator('input[name="end"]').fill(toLocalInputValue(end))
    await page.locator('input[name="notes"]').fill(notes)
    // The Reserve form's Server Action doesn't redirect or change visible
    // page content on success (unlike Borrow/Return, which flip the
    // Borrower text) -- explicitly wait for the POST + revalidation
    // round-trip to finish before moving on, rather than racing ahead.
    await Promise.all([
        page.waitForResponse((response) => response.request().method() === "POST"),
        page.getByRole("button", { name: "Reserve" }).click(),
    ])

    // ScheduleTable.listByBorrower uses a plain DynamoDB Scan, which is
    // eventually consistent by default (no ConsistentRead) -- a just-created
    // reservation can briefly not appear on the very next scan. Poll by
    // reloading rather than asserting once.
    await expect
        .poll(
            async () => {
                await page.goto("/reservations")
                return page.getByText(notes).isVisible()
            },
            { timeout: 15000 }
        )
        .toBe(true)
})
