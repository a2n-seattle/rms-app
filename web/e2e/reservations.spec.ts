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

    const notes = `e2e-reservation-${Date.now()}`
    const start = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const end = new Date(Date.now() + 25 * 60 * 60 * 1000)
    const toLocalInputValue = (d: Date) => d.toISOString().slice(0, 16)

    await page.locator('input[name="start"]').fill(toLocalInputValue(start))
    await page.locator('input[name="end"]').fill(toLocalInputValue(end))
    await page.locator('input[name="notes"]').fill(notes)
    await page.getByRole("button", { name: "Reserve" }).click()

    await page.goto("/reservations")
    await expect(page.getByText(notes)).toBeVisible()
})
