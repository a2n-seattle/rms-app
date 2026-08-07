import { test, expect, Page } from "@playwright/test"
import { cleanupReturn, resolveFamilyId } from "./cleanup"

/**
 * Cart checkout: login -> /browse -> check the fixture item's family row ->
 * cart badge shows a count -> open the checkout modal -> confirm Borrow
 * with the prefilled default time -> submit -> cart clears and the item
 * shows as borrowed. Run against the real deployed `alpha` environment
 * (same philosophy as golden-path.spec.ts). Reuses the same test fixtures
 * -- no new secret needed.
 */
const TEST_EMAIL = process.env.RMS_TEST_USER_EMAIL
const TEST_PASSWORD = process.env.RMS_TEST_USER_PASSWORD
const TEST_ITEM_ID = process.env.RMS_TEST_ITEM_ID

test.skip(!TEST_EMAIL || !TEST_PASSWORD || !TEST_ITEM_ID, "Missing RMS_TEST_USER_EMAIL/RMS_TEST_USER_PASSWORD/RMS_TEST_ITEM_ID")

/**
 * /browse paginates server-side (listItems' pageToken) with no guarantee the fixture
 * item's family lands on the first page -- follow "Load more" until its row appears or
 * pagination is exhausted, rather than assuming page 1.
 */
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

test("check a browse row, checkout as a borrow via the cart", async ({ page }) => {
    await page.goto("/test-login")
    await page.getByLabel("Email:").fill(TEST_EMAIL!)
    await page.getByLabel("Password:").fill(TEST_PASSWORD!)
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page).toHaveURL(/\/dashboard/)

    const familyId = await resolveFamilyId(page, TEST_ITEM_ID!)
    const row = await findFamilyRow(page, familyId)
    await expect(row).toBeVisible({ timeout: 15000 })

    // try/finally from here on: a failed assertion must not leave the shared fixture item
    // stuck borrowed for every other spec that runs after this one in the same CI job.
    try {
        await row.getByRole("checkbox").check()

        const cartButton = page.getByRole("button", { name: /Open cart/ })
        await expect(cartButton).toBeVisible({ timeout: 15000 })
        await cartButton.click()

        const modal = page.getByRole("dialog", { name: "Checkout" })
        await expect(modal).toBeVisible()
        // Borrow is the default mode -- the "Return by" field is already prefilled via
        // this repo's minimal #355 time defaults, no need to fill it in.
        const confirmButton = modal.getByRole("button", { name: /Borrow \d+ item/ })

        await Promise.all([page.waitForResponse((response) => response.request().method() === "POST"), confirmButton.click()])

        // A successful checkout clears the cart and closes the modal -- the badge
        // disappears entirely once the cart is empty (see CartBadge.tsx).
        await expect(page.getByRole("button", { name: /Open cart/ })).toHaveCount(0, { timeout: 15000 })
    } finally {
        await page.goto(`/items/${encodeURIComponent(TEST_ITEM_ID!)}`)
        await cleanupReturn(page)
    }

    await page.goto(`/items/${encodeURIComponent(TEST_ITEM_ID!)}`)
    await expect(page.getByText("(available)")).toBeVisible({ timeout: 15000 })
})
