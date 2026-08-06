import { test, expect } from "@playwright/test"
import { cleanupReturn, resolveFamilyId } from "./cleanup"

/**
 * Batched return: login -> borrow the test item via the resource basket
 * (BorrowFromSchedule, which records borrowGroupId) -> confirm the
 * sub-item page's Return link now goes to the batched confirmation page
 * instead of returning directly -> confirm the group and condition note
 * -> confirm it's returned and the condition shows up in History.
 *
 * Run against the real deployed `alpha` environment (same philosophy as
 * golden-path.spec.ts). Reuses the same test fixtures -- no new secret
 * needed.
 */
const TEST_EMAIL = process.env.RMS_TEST_USER_EMAIL
const TEST_PASSWORD = process.env.RMS_TEST_USER_PASSWORD
const TEST_ITEM_ID = process.env.RMS_TEST_ITEM_ID

test.skip(!TEST_EMAIL || !TEST_PASSWORD || !TEST_ITEM_ID, "Missing RMS_TEST_USER_EMAIL/RMS_TEST_USER_PASSWORD/RMS_TEST_ITEM_ID")

test("borrow via basket, return via the batched group confirmation with a condition note", async ({ page }) => {
    await page.goto("/test-login")
    await page.getByLabel("Email:").fill(TEST_EMAIL!)
    await page.getByLabel("Password:").fill(TEST_PASSWORD!)
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page).toHaveURL(/\/browse/)

    // Navigating to the sub-item id itself redirects to the single sub-item page (see
    // resolveFamilyId), not the family-level "ResourceBasket" multi-select UI this test
    // exercises -- resolve the family id first, then visit that page directly.
    const familyId = await resolveFamilyId(page, TEST_ITEM_ID!)
    await page.goto(`/items/${encodeURIComponent(familyId)}`)
    await expect(page.getByRole("button", { name: /Borrow Selected/ })).toBeVisible({ timeout: 15000 })
    const returnBy = new Date(Date.now() + 60 * 60 * 1000)
    const toLocalInputValue = (d: Date) => d.toISOString().slice(0, 16)
    await page.locator('input[name="returnBy"]').fill(toLocalInputValue(returnBy))

    // try/finally from here on: a failed assertion must not leave the shared fixture item
    // stuck borrowed for every other spec that runs after this one in the same CI job.
    try {
        await Promise.all([
            page.waitForResponse((response) => response.request().method() === "POST"),
            page.getByRole("button", { name: "Borrow Selected (1)" }).click(),
        ])

        // Sub-item page's Return action should now be a link to the batched group
        // confirmation, not a direct-return form submit. Match by href, not role name --
        // the nav bar (present on every page) has its own persistent link whose accessible
        // name is also exactly "Return" (href="/return"), so a bare
        // getByRole("link", { name: "Return" }) ambiguously matches both.
        await page.goto(`/items/${encodeURIComponent(TEST_ITEM_ID!)}`)
        const returnLink = page.locator('a[href^="/return-group/"]')
        await expect(returnLink).toBeVisible({ timeout: 15000 })
        await returnLink.click()

        await expect(page).toHaveURL(/\/return-group\//)
        const confirmButton = page.getByRole("button", { name: "Confirm Return (1)" })
        // GetBorrowGroup's Scan is eventually consistent (no ConsistentRead) -- loaded
        // right after borrowing, this page can briefly render "Nothing left to return in
        // this group" with zero items. Poll by reloading rather than checking once, same
        // caveat as this suite's other Scan-backed reads.
        await expect
            .poll(
                async () => {
                    await page.reload()
                    return confirmButton.isVisible()
                },
                { timeout: 15000, intervals: [2000] }
            )
            .toBe(true)

        const condition = `e2e-condition-${Date.now()}`
        await page.getByLabel(new RegExp(`Condition notes for`)).fill(condition)

        await Promise.all([page.waitForResponse((response) => response.request().method() === "POST"), confirmButton.click()])

        await expect
            .poll(
                async () => {
                    await page.goto("/dashboard?tab=history")
                    return page.getByText(condition).isVisible()
                },
                { timeout: 15000, intervals: [2000] }
            )
            .toBe(true)
    } finally {
        // If an assertion above failed before the group return completed, the item may
        // still be borrowed -- return it (via either the direct button or, since this
        // flow borrows through a schedule group, the group-confirmation link -- see
        // cleanupReturn) so later specs sharing this fixture see it available.
        await page.goto(`/items/${encodeURIComponent(TEST_ITEM_ID!)}`)
        await cleanupReturn(page)
    }

    await expect(page.getByText("(available)")).toBeVisible({ timeout: 15000 })
})
