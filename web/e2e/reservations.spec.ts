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
    // Signs in via web/app/test-login/page.tsx (never linked from the real
    // UI) -- the production login page is Google-only.
    await page.goto("/test-login")
    await page.getByLabel("Email:").fill(TEST_EMAIL!)
    await page.getByLabel("Password:").fill(TEST_PASSWORD!)
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page).toHaveURL(/\/browse/)

    await page.goto(`/items/${encodeURIComponent(TEST_ITEM_ID!)}`)
    await expect(page.getByRole("heading", { name: "Reserve this item" })).toBeVisible()

    const notes = `e2e-reservation-${Date.now()}`
    // Far enough out (30-395 days) that this run's window can't collide with any other spec's
    // own randomized reservation on this shared item.
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
    const [createResponse] = await Promise.all([
        page.waitForResponse((response) => response.request().method() === "POST"),
        page.getByRole("button", { name: "Reserve" }).click(),
    ])
    expect(createResponse.ok(), `create-reservation failed: ${await createResponse.text()}`).toBe(true)
    // Capture the resolved schedule id so this run's own reservation can be cancelled
    // afterward via its aria-label on the dashboard (see dashboard/page.tsx) -- this test
    // used to leave every reservation it created permanently on the shared fixture item,
    // which is what caused other specs sharing it to eventually see many accumulated
    // "Upcoming" reservations and fail with ambiguous-locator strict-mode violations.
    const scheduleId: string = await createResponse.json()

    try {
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
    } finally {
        await page.goto("/dashboard")
        const cancelButton = page.getByRole("button", { name: `Cancel reservation ${scheduleId}` })
        if (await cancelButton.isVisible().catch(() => false)) {
            await cancelButton.click()
        }
    }
})
