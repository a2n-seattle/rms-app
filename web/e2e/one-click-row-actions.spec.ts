import { test, expect, Page } from "@playwright/test"
import { cleanupReturn, resolveFamilyId } from "./cleanup"

/**
 * One-click row actions: login -> /browse -> one-click Borrow the fixture
 * item's family row (resolves availability, confirms with the prefilled
 * default time) -> item borrowed -> reloading /browse now shows a Return
 * icon on that row (the "forgot I had this borrowed" case) -> one-click
 * Return -> item available again. Run against the real deployed `alpha`
 * environment (same philosophy as golden-path.spec.ts). Reuses the same
 * test fixtures -- no new secret needed.
 */
const TEST_EMAIL = process.env.RMS_TEST_USER_EMAIL
const TEST_PASSWORD = process.env.RMS_TEST_USER_PASSWORD
const TEST_ITEM_ID = process.env.RMS_TEST_ITEM_ID

test.skip(!TEST_EMAIL || !TEST_PASSWORD || !TEST_ITEM_ID, "Missing RMS_TEST_USER_EMAIL/RMS_TEST_USER_PASSWORD/RMS_TEST_ITEM_ID")

/** Same pagination caveat as cart-checkout.spec.ts -- follow "Load more" until found. */
async function findFamilyRow(page: Page, familyId: string) {
    await page.goto("/browse")
    const row = page.locator("tr", { has: page.locator(`a[href="/items/${encodeURIComponent(familyId)}"]`) })

    for (let i = 0; i < 20; i++) {
        if (await row.isVisible().catch(() => false)) {
            return row
        }
        const loadMore = page.getByRole("link", { name: "Load more" })
        if (!(await loadMore.isVisible().catch(() => false))) {
            break
        }
        await loadMore.click()
    }
    return row
}

test("one-click borrow from browse, then one-click return once it shows as yours", async ({ page }) => {
    await page.goto("/test-login")
    await page.getByLabel("Email:").fill(TEST_EMAIL!)
    await page.getByLabel("Password:").fill(TEST_PASSWORD!)
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page).toHaveURL(/\/dashboard/)

    const familyId = await resolveFamilyId(page, TEST_ITEM_ID!)
    let row = await findFamilyRow(page, familyId)
    await expect(row).toBeVisible({ timeout: 15000 })

    // try/finally from here on: a failed assertion must not leave the shared fixture item
    // stuck borrowed for every other spec that runs after this one in the same CI job.
    try {
        await row.getByLabel(/^Borrow /).click()

        const borrowDialog = page.getByRole("dialog", { name: /^Borrow / })
        await expect(borrowDialog).toBeVisible()
        const confirmBorrow = borrowDialog.getByRole("button", { name: /Borrow \d+ item/ })
        await expect(confirmBorrow).toBeEnabled({ timeout: 15000 })

        await Promise.all([page.waitForResponse((response) => response.request().method() === "POST"), confirmBorrow.click()])
        await expect(borrowDialog).toBeHidden({ timeout: 15000 })

        // myBorrowedByFamily is computed server-side on page load -- reload to see the
        // Return icon that should now be gated in for this row.
        await expect
            .poll(
                async () => {
                    row = await findFamilyRow(page, familyId)
                    return row.getByLabel(/^Return /).isVisible().catch(() => false)
                },
                { timeout: 15000, intervals: [2000] }
            )
            .toBe(true)

        await row.getByLabel(/^Return /).click()
        const returnDialog = page.getByRole("dialog", { name: /^Return / })
        await expect(returnDialog).toBeVisible()

        await Promise.all([
            page.waitForResponse((response) => response.request().method() === "POST"),
            returnDialog.getByRole("button", { name: /Return \d+ item/ }).click(),
        ])
        await expect(returnDialog).toBeHidden({ timeout: 15000 })
    } finally {
        await page.goto(`/items/${encodeURIComponent(TEST_ITEM_ID!)}`)
        await cleanupReturn(page)
    }

    await page.goto(`/items/${encodeURIComponent(TEST_ITEM_ID!)}`)
    await expect(page.getByText("(available)")).toBeVisible({ timeout: 15000 })
})
