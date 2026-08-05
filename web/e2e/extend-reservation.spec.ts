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
    const [createResponse] = await Promise.all([
        page.waitForResponse((response) => response.request().method() === "POST"),
        page.getByRole("button", { name: "Reserve" }).click(),
    ])
    expect(createResponse.ok(), `create-reservation failed: ${await createResponse.text()}`).toBe(true)

    // ListUpcomingReservations scans+filters, eventually consistent --
    // poll rather than assert once (same caveat as other specs).
    await expect
        .poll(
            async () => {
                await page.goto("/dashboard?tab=scheduled")
                return page.getByText(notes).isVisible()
            },
            { timeout: 15000 }
        )
        .toBe(true)

    const newEndInput = page.getByLabel(/New end time for reservation/)
    await newEndInput.fill(toLocalInputValue(newEnd))

    const [extendResponse] = await Promise.all([
        page.waitForResponse((response) => response.request().method() === "POST"),
        page.getByRole("button", { name: "Extend" }).click(),
    ])
    expect(extendResponse.ok(), `extend-reservation failed: ${await extendResponse.text()}`).toBe(true)

    await expect
        .poll(
            async () => {
                await page.goto("/dashboard?tab=scheduled")
                return page.getByText(newEnd.toLocaleString()).isVisible()
            },
            { timeout: 15000 }
        )
        .toBe(true)
})
