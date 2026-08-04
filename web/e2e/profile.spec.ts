import { test, expect } from "@playwright/test"

/**
 * Profile: login -> update display name -> verify the nav reflects the new
 * name, run against the real deployed `alpha` environment (same philosophy
 * as golden-path.spec.ts).
 *
 * Only exercises the name-edit path -- email editing is deferred to a
 * future issue (changing email also changes the Cognito username, and
 * e2e-verifying it would require reading a real inbox for the
 * confirmation code, which this repo's test setup has no way to do).
 *
 * Reuses the same login fixtures as golden-path.spec.ts -- no new secret
 * needed:
 *   RMS_TEST_USER_EMAIL, RMS_TEST_USER_PASSWORD
 */
const TEST_EMAIL = process.env.RMS_TEST_USER_EMAIL
const TEST_PASSWORD = process.env.RMS_TEST_USER_PASSWORD

test.skip(!TEST_EMAIL || !TEST_PASSWORD, "Missing RMS_TEST_USER_EMAIL/RMS_TEST_USER_PASSWORD")

test("update display name and see it reflected in the nav", async ({ page }) => {
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

    await page.goto("/profile")

    const newName = `E2E Test User ${Date.now()}`
    await page.getByLabel("Name:").fill(newName)
    await page.getByRole("button", { name: "Save" }).click()

    await expect(page.getByText("Saved.")).toBeVisible()

    // Confirms the fetchAuthSession({ forceRefresh: true }) + router.refresh()
    // mechanism actually propagates the new name into the Server
    // Component-rendered nav (which prefers session.name over
    // session.email once a name is set), not just that the Cognito call
    // succeeded.
    await page.goto("/browse")
    await expect(page.getByText(newName)).toBeVisible()
})
