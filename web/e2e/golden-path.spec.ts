import { test, expect } from "@playwright/test"
import { waitVisible } from "./cleanup"

/**
 * Golden path: login -> browse -> borrow -> return, run against the real
 * deployed `alpha` environment (per this repo's "verify against real
 * alpha" philosophy) rather than a mocked backend.
 *
 * Requires a dedicated test Cognito user (email/password, not Google SSO
 * -- Google's redirect flow isn't practical to automate in CI) and a
 * seeded test item, both provided via env vars so no real credentials are
 * ever committed:
 *   RMS_TEST_USER_EMAIL, RMS_TEST_USER_PASSWORD, RMS_TEST_ITEM_ID
 *
 * Signs in via web/app/test-login/page.tsx, a separate email/password page
 * used only for e2e testing (never linked from the real UI) -- the
 * production login page (/login) is Google-only.
 */
const TEST_EMAIL = process.env.RMS_TEST_USER_EMAIL
const TEST_PASSWORD = process.env.RMS_TEST_USER_PASSWORD
const TEST_ITEM_ID = process.env.RMS_TEST_ITEM_ID

test.skip(!TEST_EMAIL || !TEST_PASSWORD || !TEST_ITEM_ID, "Missing RMS_TEST_USER_EMAIL/RMS_TEST_USER_PASSWORD/RMS_TEST_ITEM_ID")

test("login, browse, borrow, and return an item", async ({ page }) => {
    await page.goto("/test-login")
    await page.getByLabel("Email:").fill(TEST_EMAIL!)
    await page.getByLabel("Password:").fill(TEST_PASSWORD!)
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page).toHaveURL(/\/dashboard/)

    await page.goto(`/items/${encodeURIComponent(TEST_ITEM_ID!)}`)

    // try/finally from here on: a failed assertion must not leave the shared fixture item
    // stuck borrowed for every other spec that runs after this one in the same CI job.
    try {
        await Promise.all([
            page.waitForResponse((response) => response.request().method() === "POST"),
            page.getByRole("button", { name: "Borrow" }).click(),
        ])
        // As of GH-353, `borrower` is a Cognito sub, not the user's email -- the item
        // detail page no longer displays TEST_EMAIL anywhere, so confirm the borrowed
        // state via the "Return" button appearing instead.
        await expect(page.getByRole("button", { name: "Return" })).toBeVisible({ timeout: 15000 })
    } finally {
        const returnButton = page.getByRole("button", { name: "Return" })
        if (await waitVisible(returnButton)) {
            await returnButton.click()
        }
    }

    await expect(page.getByText("(available)")).toBeVisible({ timeout: 15000 })
})
