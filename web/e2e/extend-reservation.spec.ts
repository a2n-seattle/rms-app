import { test, expect } from "@playwright/test"

/**
 * Extend reservation: login -> reserve the test item -> extend it from the
 * dashboard's Scheduled tab -> confirm the new end time shows. Run against
 * the real deployed `alpha` environment (same philosophy as
 * golden-path.spec.ts). Reuses the same test fixtures -- no new secret
 * needed.
 */
const TEST_EMAIL = process.env.RMS_TEST_USER_EMAIL
const TEST_PASSWORD = process.env.RMS_TEST_USER_PASSWORD
const TEST_ITEM_ID = process.env.RMS_TEST_ITEM_ID

test.skip(!TEST_EMAIL || !TEST_PASSWORD || !TEST_ITEM_ID, "Missing RMS_TEST_USER_EMAIL/RMS_TEST_USER_PASSWORD/RMS_TEST_ITEM_ID")

test("reserve, then extend it from the dashboard's Scheduled tab", async ({ page }) => {
    await page.goto("/test-login")
    await page.getByLabel("Email:").fill(TEST_EMAIL!)
    await page.getByLabel("Password:").fill(TEST_PASSWORD!)
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page).toHaveURL(/\/browse/)

    await page.goto(`/items/${encodeURIComponent(TEST_ITEM_ID!)}`)

    // Far-future randomized window, same rationale as dashboard.spec.ts --
    // avoids colliding with any leftover reservation on this shared item
    // across CI runs.
    const notes = `e2e-extend-${Date.now()}`
    const offsetDays = 30 + Math.floor(Math.random() * 365)
    const start = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    const newEnd = new Date(end.getTime() + 60 * 60 * 1000)
    const toLocalInputValue = (d: Date) => d.toISOString().slice(0, 16)

    await page.locator('input[name="start"]').fill(toLocalInputValue(start))
    await page.locator('input[name="end"]').fill(toLocalInputValue(end))
    await page.locator('input[name="notes"]').fill(notes)
    // A Server Action's POST response body is Next.js's internal RSC "flight"
    // wire format, not plain JSON -- only `.ok()` is safe to read here, not
    // `.json()`/the action's actual return value.
    const [createResponse] = await Promise.all([
        page.waitForResponse((response) => response.request().method() === "POST"),
        page.getByRole("button", { name: "Reserve" }).click(),
    ])
    expect(createResponse.ok(), `create-reservation failed with status ${createResponse.status()}`).toBe(true)

    try {
        // ListUpcomingReservations scans+filters, eventually consistent --
        // poll rather than assert once (same caveat as other specs). The
        // unique `notes` text scopes the row locator to *this* run's own
        // reservation, instead of a broad query that matches every scheduled
        // reservation's input when more than one exists on this shared
        // fixture item (accumulated leftovers from other specs/retries are
        // common here).
        const row = page.locator('[data-testid="scheduled-row"]', { hasText: notes })
        await expect
            .poll(
                async () => {
                    await page.goto("/dashboard?tab=scheduled")
                    return row.isVisible()
                },
                { timeout: 15000 }
            )
            .toBe(true)

        const newEndInput = row.getByLabel("New end time")
        await newEndInput.fill(toLocalInputValue(newEnd))

        const [extendResponse] = await Promise.all([
            page.waitForResponse((response) => response.request().method() === "POST"),
            row.getByRole("button", { name: "Extend" }).click(),
        ])
        expect(extendResponse.ok(), `extend-reservation failed with status ${extendResponse.status()}`).toBe(true)

        await expect
            .poll(
                async () => {
                    await page.goto("/dashboard?tab=scheduled")
                    return row.getByText(newEnd.toLocaleString()).isVisible()
                },
                { timeout: 15000 }
            )
            .toBe(true)
    } finally {
        // Cancel this run's own reservation so it doesn't accumulate on the shared fixture
        // item for every later spec/run.
        await page.goto("/dashboard")
        const alert = page.locator('[data-testid="upcoming-alert"]', { hasText: notes })
        const cancelButton = alert.getByRole("button", { name: "Cancel" })
        if (await cancelButton.isVisible().catch(() => false)) {
            await cancelButton.click()
        }
    }
})
