import { test, expect } from "@playwright/test"
import { cleanupReturn, resolveFamilyId } from "./cleanup"

/**
 * Resource basket: login -> visit the test item's resource (family) page
 * -> confirm all sub-items are selected by default -> borrow the
 * selection via "Borrow Selected" (prompts for a return date, goes
 * through create-reservation-then-borrow-from-schedule under the hood)
 * -> confirm the sub-item shows as borrowed -> return it directly on the
 * sub-item page to leave state clean for other specs sharing this item.
 *
 * Run against the real deployed `alpha` environment (same philosophy as
 * golden-path.spec.ts). Reuses the same test fixtures -- no new secret
 * needed.
 */
const TEST_EMAIL = process.env.RMS_TEST_USER_EMAIL
const TEST_PASSWORD = process.env.RMS_TEST_USER_PASSWORD
const TEST_ITEM_ID = process.env.RMS_TEST_ITEM_ID

test.skip(!TEST_EMAIL || !TEST_PASSWORD || !TEST_ITEM_ID, "Missing RMS_TEST_USER_EMAIL/RMS_TEST_USER_PASSWORD/RMS_TEST_ITEM_ID")

test("borrow via the resource basket's default all-selected state", async ({ page }) => {
    await page.goto("/test-login")
    await page.getByLabel("Email:").fill(TEST_EMAIL!)
    await page.getByLabel("Password:").fill(TEST_PASSWORD!)
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page).toHaveURL(/\/dashboard/)

    // Navigating to the sub-item id itself redirects to the single sub-item page (see
    // resolveFamilyId), not the family-level "ResourceBasket" multi-select UI this test
    // exercises -- resolve the family id first, then visit that page directly.
    const familyId = await resolveFamilyId(page, TEST_ITEM_ID!)
    await page.goto(`/items/${encodeURIComponent(familyId)}`)
    await expect(page.getByRole("button", { name: /Borrow Selected/ })).toBeVisible({ timeout: 15000 })
    // Default-all-selected: the one sub-item on this family should
    // already be checked, so "Borrow Selected (1)" reads non-zero.
    await expect(page.getByRole("button", { name: "Borrow Selected (1)" })).toBeEnabled()

    // try/finally from here on: a failed assertion must not leave the shared fixture item
    // stuck borrowed for every other spec that runs after this one in the same CI job.
    try {
        const returnBy = new Date(Date.now() + 60 * 60 * 1000)
        const toLocalInputValue = (d: Date) => d.toISOString().slice(0, 16)
        await page.locator('input[name="returnBy"]').fill(toLocalInputValue(returnBy))

        await Promise.all([
            page.waitForResponse((response) => response.request().method() === "POST"),
            page.getByRole("button", { name: "Borrow Selected (1)" }).click(),
        ])

        // GH-356: the borrow/reserve forms stay mounted in place across the page's
        // revalidation (unlike items/[id]/[subId]'s borrow/return toggle), so the inline
        // success indicator is reliably visible here.
        await expect(page.getByRole("status")).toContainText("borrowed successfully", { timeout: 15000 })
    } finally {
        // Clean up: return via the sub-item page so other specs sharing this
        // fixture item see it available again. "Borrow Selected" goes through
        // BorrowFromSchedule, which sets borrowGroupId -- the Return control here is a
        // *link* to the batched group confirmation, not a plain button (see cleanupReturn).
        await page.goto(`/items/${encodeURIComponent(TEST_ITEM_ID!)}`)
        await cleanupReturn(page)
    }

    // cleanupReturn's group-confirm click redirects to /dashboard on success -- navigate
    // back to the item page before checking availability, rather than asserting on
    // whatever page cleanup happened to land on.
    await page.goto(`/items/${encodeURIComponent(TEST_ITEM_ID!)}`)
    await expect(page.getByText("(available)")).toBeVisible({ timeout: 15000 })
})
