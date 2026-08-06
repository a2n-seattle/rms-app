import { test, expect } from "@playwright/test"
import { waitVisible } from "./cleanup"

/**
 * Multi-select return: login -> borrow the test item -> visit /return ->
 * confirm it's pre-selected -> Confirm Return -> confirm it's available
 * again. Run against the real deployed `alpha` environment (same
 * philosophy as golden-path.spec.ts). Reuses the same test fixtures --
 * no new secret needed.
 */
const TEST_EMAIL = process.env.RMS_TEST_USER_EMAIL
const TEST_PASSWORD = process.env.RMS_TEST_USER_PASSWORD
const TEST_ITEM_ID = process.env.RMS_TEST_ITEM_ID

test.skip(!TEST_EMAIL || !TEST_PASSWORD || !TEST_ITEM_ID, "Missing RMS_TEST_USER_EMAIL/RMS_TEST_USER_PASSWORD/RMS_TEST_ITEM_ID")

test("borrow, then return via the multi-select /return page", async ({ page }) => {
    await page.goto("/test-login")
    await page.getByLabel("Email:").fill(TEST_EMAIL!)
    await page.getByLabel("Password:").fill(TEST_PASSWORD!)
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page).toHaveURL(/\/browse/)

    await page.goto(`/items/${encodeURIComponent(TEST_ITEM_ID!)}`)
    await Promise.all([
        page.waitForResponse((response) => response.request().method() === "POST"),
        page.getByRole("button", { name: "Borrow" }).click(),
    ])
    // As of GH-353, `borrower` is a Cognito sub, not the user's email -- the item detail
    // page no longer displays TEST_EMAIL anywhere, so confirm the borrowed state via the
    // "Return" button appearing instead.
    await expect(page.getByRole("button", { name: "Return" })).toBeVisible({ timeout: 15000 })

    // try/finally from here on: a failed assertion must not leave the shared fixture item
    // stuck borrowed for every other spec that runs after this one in the same CI job.
    try {
        // ListMyBorrowedItems scans+filters, eventually consistent -- poll
        // rather than assert once (same caveat as other specs in this suite).
        const confirmButton = page.getByRole("button", { name: "Confirm Return (1)" })
        await expect
            .poll(
                async () => {
                    await page.goto("/return")
                    return confirmButton.isVisible()
                },
                { timeout: 15000, intervals: [2000] }
            )
            .toBe(true)

        await Promise.all([page.waitForResponse((response) => response.request().method() === "POST"), confirmButton.click()])
    } finally {
        await page.goto(`/items/${encodeURIComponent(TEST_ITEM_ID!)}`)
        const returnButton = page.getByRole("button", { name: "Return" })
        if (await waitVisible(returnButton)) {
            await returnButton.click()
        }
    }

    await expect(page.getByText("(available)")).toBeVisible({ timeout: 15000 })
})
