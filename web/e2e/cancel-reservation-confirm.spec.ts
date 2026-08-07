import { test, expect } from "@playwright/test"
import { cancelReservation } from "./cleanup"

/**
 * Cancel-with-confirm: login -> reserve the test item -> on the dashboard's
 * "Upcoming" alert, clicking Cancel opens a confirm dialog rather than
 * acting immediately -- "Never mind" leaves the reservation intact, only
 * "Confirm cancel" removes it. Also covers the Scheduled tab's row-level
 * Cancel action (GH-361 added this; only Extend existed there before).
 * Run against the real deployed `alpha` environment (same philosophy as
 * golden-path.spec.ts). Reuses the same test fixtures -- no new secret
 * needed.
 */
const TEST_EMAIL = process.env.RMS_TEST_USER_EMAIL
const TEST_PASSWORD = process.env.RMS_TEST_USER_PASSWORD
const TEST_ITEM_ID = process.env.RMS_TEST_ITEM_ID

test.skip(!TEST_EMAIL || !TEST_PASSWORD || !TEST_ITEM_ID, "Missing RMS_TEST_USER_EMAIL/RMS_TEST_USER_PASSWORD/RMS_TEST_ITEM_ID")

async function reserve(page: import("@playwright/test").Page, notes: string) {
    await page.goto(`/items/${encodeURIComponent(TEST_ITEM_ID!)}`)
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
    expect(createResponse.ok(), `create-reservation failed with status ${createResponse.status()}`).toBe(true)
}

test("clicking Cancel opens a confirm dialog; only Confirm cancel removes the reservation", async ({ page }) => {
    await page.goto("/test-login")
    await page.getByLabel("Email:").fill(TEST_EMAIL!)
    await page.getByLabel("Password:").fill(TEST_PASSWORD!)
    await page.getByRole("button", { name: "Sign in" }).click()
    await expect(page).toHaveURL(/\/dashboard/)

    const notes = `e2e-cancel-confirm-${Date.now()}`
    await reserve(page, notes)

    try {
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

        // Cancel alone only opens the dialog -- the reservation must still be listed.
        await alert.getByRole("button", { name: "Cancel" }).click()
        await expect(page.getByRole("dialog", { name: "Cancel this reservation?" })).toBeVisible()
        await expect(alert).toBeVisible()

        // "Never mind" closes the dialog without cancelling.
        await page.getByRole("button", { name: "Never mind" }).click()
        await expect(page.getByRole("dialog")).toHaveCount(0)
        await expect(alert).toBeVisible()

        // Cancel -> Confirm cancel actually removes it.
        await alert.getByRole("button", { name: "Cancel" }).click()
        await Promise.all([
            page.waitForResponse((response) => response.request().method() === "POST"),
            page.getByRole("button", { name: "Confirm cancel" }).click(),
        ])
        await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 15000 })
    } finally {
        const alert = page.locator('[data-testid="upcoming-alert"]', { hasText: notes })
        await cancelReservation(alert)
    }
})

test("Scheduled tab row shows both Extend and Cancel; Cancel there removes the reservation too", async ({ page }) => {
    await page.goto("/test-login")
    await page.getByLabel("Email:").fill(TEST_EMAIL!)
    await page.getByLabel("Password:").fill(TEST_PASSWORD!)
    await page.getByRole("button", { name: "Sign in" }).click()
    await expect(page).toHaveURL(/\/dashboard/)

    const notes = `e2e-scheduled-cancel-${Date.now()}`
    await reserve(page, notes)

    try {
        const row = page.locator('[data-testid="scheduled-row"]', { hasText: notes })
        await expect
            .poll(
                async () => {
                    await page.goto("/dashboard?tab=scheduled")
                    return row.isVisible()
                },
                { timeout: 15000, intervals: [2000] }
            )
            .toBe(true)

        await expect(row.getByRole("button", { name: "Extend" })).toBeVisible()
        await expect(row.getByLabel(/^Cancel reservation /)).toBeVisible()

        await row.getByLabel(/^Cancel reservation /).click()
        await Promise.all([
            page.waitForResponse((response) => response.request().method() === "POST"),
            page.getByRole("button", { name: "Confirm cancel" }).click(),
        ])

        await expect
            .poll(
                async () => {
                    await page.goto("/dashboard?tab=scheduled")
                    return row.isVisible()
                },
                { timeout: 15000, intervals: [2000] }
            )
            .toBe(false)
    } finally {
        await page.goto("/dashboard")
        const alert = page.locator('[data-testid="upcoming-alert"]', { hasText: notes })
        await cancelReservation(alert)
    }
})
