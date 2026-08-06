import { test, expect } from "@playwright/test"

/**
 * GH-356 regression: borrowing an already-borrowed item must show an inline error message,
 * not Next's generic crash/error page. Login -> open the shared test item's page in two
 * tabs (simulating two racing borrow attempts, same account/session -- BorrowItem's conflict
 * check doesn't care about borrower identity, only that the item is already borrowed) ->
 * borrow from tab 1 (succeeds) -> submit the still-loaded (stale) borrow form on tab 2, whose
 * Server Action call is independent of tab 1's revalidation -> BorrowItem rejects it -> assert
 * an inline alert renders on tab 2 with no navigation to an error page -> clean up.
 *
 * Run against the real deployed `alpha` environment (same philosophy as golden-path.spec.ts).
 * Reuses the same test fixtures -- no new secret needed.
 */
const TEST_EMAIL = process.env.RMS_TEST_USER_EMAIL
const TEST_PASSWORD = process.env.RMS_TEST_USER_PASSWORD
const TEST_ITEM_ID = process.env.RMS_TEST_ITEM_ID

test.skip(!TEST_EMAIL || !TEST_PASSWORD || !TEST_ITEM_ID, "Missing RMS_TEST_USER_EMAIL/RMS_TEST_USER_PASSWORD/RMS_TEST_ITEM_ID")

test("borrowing an already-borrowed item shows an inline error instead of crashing", async ({ page, context }) => {
    await page.goto("/test-login")
    await page.getByLabel("Email:").fill(TEST_EMAIL!)
    await page.getByLabel("Password:").fill(TEST_PASSWORD!)
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page).toHaveURL(/\/browse/)

    const itemUrl = `/items/${encodeURIComponent(TEST_ITEM_ID!)}/${encodeURIComponent(TEST_ITEM_ID!)}`
    await page.goto(itemUrl)
    await expect(page.getByRole("button", { name: "Borrow" })).toBeVisible()

    // Second tab, same authenticated session (shares the browser context's cookies), loaded
    // *before* tab 1's borrow -- its "Borrow" form is bound to the item's still-available
    // state, independent of tab 1's later revalidation.
    const page2 = await context.newPage()
    await page2.goto(itemUrl)
    await expect(page2.getByRole("button", { name: "Borrow" })).toBeVisible()

    // try/finally from here on: a failed assertion at ANY point below -- including the
    // borrow itself -- must not leave the shared fixture item stuck borrowed for every
    // other spec that runs after this one in the same CI job. (This used to start only
    // after the post-borrow "Return" assertion, which meant a failure in that very
    // assertion skipped cleanup entirely and left the item borrowed for the rest of the
    // suite -- exactly what caused every later spec to fail with "Borrow" button not
    // found.)
    try {
        // Tab 1: borrow succeeds. Generous timeout on the post-borrow assertion -- the POST
        // resolving doesn't guarantee the revalidated Server Component has finished
        // re-rendering client-side yet under real CI network conditions.
        await Promise.all([
            page.waitForResponse((response) => response.request().method() === "POST"),
            page.getByRole("button", { name: "Borrow" }).click(),
        ])
        await expect(page.getByRole("button", { name: "Return" })).toBeVisible({ timeout: 15000 })

        // Tab 2: submits its stale "Borrow" form against the now-already-borrowed item.
        // BorrowItem rejects with "Unable to borrow item: Item is currently being borrowed by
        // '...'" -- assert that surfaces as an inline alert, not a crash/error page.
        await Promise.all([
            page2.waitForResponse((response) => response.request().method() === "POST"),
            page2.getByRole("button", { name: "Borrow" }).click(),
        ])
        // Scope the locator to text content, not just role="alert" -- Next's hidden
        // route-announcer div (#__next-route-announcer__, used for a11y navigation
        // announcements) also has role="alert" and would otherwise match too.
        const conflictAlert = page2.locator('[role="alert"]', { hasText: "currently being borrowed" })
        await expect(conflictAlert).toBeVisible()
        // Still the normal item page underneath the alert -- no navigation to an error page.
        await expect(page2.getByRole("heading", { level: 1 })).toBeVisible()
    } finally {
        await page2.close()
        // Clean up via tab 1, which should still show the item as borrowed, regardless of
        // whether the assertions above passed. Reload first in case tab 1's own view is stale.
        await page.reload()
        const returnButton = page.getByRole("button", { name: "Return" })
        if (await returnButton.isVisible({ timeout: 15000 }).catch(() => false)) {
            await returnButton.click()
        }
    }

    await expect(page.getByText("(available)")).toBeVisible()
})
