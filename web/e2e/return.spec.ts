import { test, expect } from "@playwright/test"

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
    await page.getByRole("button", { name: "Borrow" }).click()
    await expect(page.getByText(TEST_EMAIL!)).toBeVisible()

    // ListMyBorrowedItems scans+filters, eventually consistent -- poll
    // rather than assert once (same caveat as other specs in this suite).
    await expect
        .poll(
            async () => {
                await page.goto("/return")
                return page.getByRole("button", { name: /Confirm Return/ }).isVisible()
            },
            { timeout: 15000 }
        )
        .toBe(true)

    await expect(page.getByRole("button", { name: "Confirm Return (1)" })).toBeVisible()

    await Promise.all([
        page.waitForResponse((response) => response.request().method() === "POST"),
        page.getByRole("button", { name: "Confirm Return (1)" }).click(),
    ])

    await page.goto(`/items/${encodeURIComponent(TEST_ITEM_ID!)}`)
    await expect(page.getByText("(available)")).toBeVisible()
})
