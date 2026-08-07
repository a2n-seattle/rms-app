import { test, expect } from "@playwright/test"
import { waitVisible } from "./cleanup"

/**
 * Borrowed-tab checkbox select -> Return Selected: login -> borrow the test
 * item -> on the Dashboard's Currently Borrowed tab, check its row -> click
 * "Return Selected" -> land on /return with exactly that item pre-checked
 * -> add a condition note -> Confirm Return -> item no longer borrowed and
 * the note shows up in History. Run against the real deployed `alpha`
 * environment (same philosophy as golden-path.spec.ts). Reuses the same
 * test fixtures -- no new secret needed.
 */
const TEST_EMAIL = process.env.RMS_TEST_USER_EMAIL
const TEST_PASSWORD = process.env.RMS_TEST_USER_PASSWORD
const TEST_ITEM_ID = process.env.RMS_TEST_ITEM_ID

test.skip(!TEST_EMAIL || !TEST_PASSWORD || !TEST_ITEM_ID, "Missing RMS_TEST_USER_EMAIL/RMS_TEST_USER_PASSWORD/RMS_TEST_ITEM_ID")

test("select a borrowed row on the dashboard, return it with a condition note via /return", async ({ page }) => {
    await page.goto("/test-login")
    await page.getByLabel("Email:").fill(TEST_EMAIL!)
    await page.getByLabel("Password:").fill(TEST_PASSWORD!)
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page).toHaveURL(/\/dashboard/)

    await page.goto(`/items/${encodeURIComponent(TEST_ITEM_ID!)}`)
    await Promise.all([
        page.waitForResponse((response) => response.request().method() === "POST"),
        page.getByRole("button", { name: "Borrow" }).click(),
    ])
    await expect(page.getByRole("button", { name: "Return" })).toBeVisible({ timeout: 15000 })

    // try/finally from here on: a failed assertion must not leave the shared fixture item
    // stuck borrowed for every other spec that runs after this one in the same CI job.
    try {
        // ListMyBorrowedItems scans+filters, eventually consistent -- poll rather than
        // assert once (same caveat as other specs in this suite).
        const row = page.locator("tr", { has: page.getByRole("link", { name: /^E2E Test/ }) })
        await expect
            .poll(
                async () => {
                    await page.goto("/dashboard?tab=borrowed")
                    return row.isVisible()
                },
                { timeout: 15000, intervals: [2000] }
            )
            .toBe(true)

        await row.getByRole("checkbox").click()
        const returnSelected = page.getByRole("link", { name: "Return Selected (1)" })
        await expect(returnSelected).toBeVisible()
        await returnSelected.click()

        await expect(page).toHaveURL(/\/return\?ids=/)
        const confirmButton = page.getByRole("button", { name: "Confirm Return (1)" })
        await expect(confirmButton).toBeVisible({ timeout: 15000 })

        const notes = `e2e-borrowed-multi-return-${Date.now()}`
        await page.locator('input[name="notes"]').fill(notes)
        await page.getByLabel(/^Condition notes for /).fill("scuffed corner")

        await Promise.all([page.waitForResponse((response) => response.request().method() === "POST"), confirmButton.click()])
    } finally {
        await page.goto(`/items/${encodeURIComponent(TEST_ITEM_ID!)}`)
        const returnButton = page.getByRole("button", { name: "Return" })
        if (await waitVisible(returnButton)) {
            await returnButton.click()
        }
    }

    await expect(page.getByText("(available)")).toBeVisible({ timeout: 15000 })

    // ListHistory scans+filters, eventually consistent -- poll for the condition note to
    // show up under the Dashboard's History tab.
    await expect
        .poll(
            async () => {
                await page.goto("/dashboard?tab=history")
                return page.getByText("scuffed corner").isVisible()
            },
            { timeout: 15000, intervals: [2000] }
        )
        .toBe(true)
})
