import { test, expect } from "@playwright/test"

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

    await expect(page).toHaveURL(/\/browse/)

    // Navigating to the sub-item id directly redirects to the family
    // (basket) page at /items/<familyId> -- capture that resolved URL so
    // we can return via the sub-item's nested route afterwards.
    await page.goto(`/items/${encodeURIComponent(TEST_ITEM_ID!)}`)
    await expect(page.getByRole("button", { name: /Borrow Selected/ })).toBeVisible()
    // Default-all-selected: the one sub-item on this family should
    // already be checked, so "Borrow Selected (1)" reads non-zero.
    await expect(page.getByRole("button", { name: "Borrow Selected (1)" })).toBeEnabled()

    const returnBy = new Date(Date.now() + 60 * 60 * 1000)
    const toLocalInputValue = (d: Date) => d.toISOString().slice(0, 16)
    await page.locator('input[name="returnBy"]').fill(toLocalInputValue(returnBy))

    await Promise.all([
        page.waitForResponse((response) => response.request().method() === "POST"),
        page.getByRole("button", { name: "Borrow Selected (1)" }).click(),
    ])

    await expect(page.getByText(TEST_EMAIL!)).toBeVisible()

    // Clean up: return via the sub-item page so other specs sharing this
    // fixture item see it available again.
    await page.goto(`/items/${encodeURIComponent(TEST_ITEM_ID!)}`)
    await page.getByRole("button", { name: "Return" }).click()
    await expect(page.getByText("(available)")).toBeVisible()
})
