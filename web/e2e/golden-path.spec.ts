import { test, expect } from "@playwright/test"

/**
 * Golden path: login -> browse -> borrow -> return, run against the real
 * deployed `alpha` environment (per this repo's "verify against real
 * alpha" philosophy) rather than a mocked backend.
 *
 * Requires a dedicated test Cognito user (email/password, not Google SSO
 * -- Hosted UI's Google redirect isn't practical to automate in CI) and a
 * seeded test item, both provided via env vars so no real credentials are
 * ever committed:
 *   RMS_TEST_USER_EMAIL, RMS_TEST_USER_PASSWORD, RMS_TEST_ITEM_ID
 */
const TEST_EMAIL = process.env.RMS_TEST_USER_EMAIL
const TEST_PASSWORD = process.env.RMS_TEST_USER_PASSWORD
const TEST_ITEM_ID = process.env.RMS_TEST_ITEM_ID

test.skip(!TEST_EMAIL || !TEST_PASSWORD || !TEST_ITEM_ID, "Missing RMS_TEST_USER_EMAIL/RMS_TEST_USER_PASSWORD/RMS_TEST_ITEM_ID")

test("login, browse, borrow, and return an item", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Email").fill(TEST_EMAIL!)
    await page.getByLabel("Password").fill(TEST_PASSWORD!)
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page).toHaveURL(/\/browse/)

    await page.goto(`/items/${encodeURIComponent(TEST_ITEM_ID!)}`)
    await page.getByRole("button", { name: "Borrow" }).click()
    await expect(page.getByText(TEST_EMAIL!)).toBeVisible()

    await page.getByRole("button", { name: "Return" }).click()
    await expect(page.getByText("(available)")).toBeVisible()
})
