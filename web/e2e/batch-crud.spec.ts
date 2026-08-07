import { test, expect } from "@playwright/test"

/**
 * Batch CRUD (GH-364): login -> create a batch containing the shared test
 * item -> confirm it appears in /batches and its detail page resolves the
 * item -> delete it -> confirm it's gone from /batches.
 *
 * Only needs login credentials and the shared test item id (read-only
 * membership, no borrow/return/reserve side effects), so it carries no
 * cleanup risk for other specs' shared item state. Run against the real
 * deployed `alpha` environment (same philosophy as golden-path.spec.ts).
 */
const TEST_EMAIL = process.env.RMS_TEST_USER_EMAIL
const TEST_PASSWORD = process.env.RMS_TEST_USER_PASSWORD
const TEST_ITEM_ID = process.env.RMS_TEST_ITEM_ID

test.skip(!TEST_EMAIL || !TEST_PASSWORD || !TEST_ITEM_ID, "Missing RMS_TEST_USER_EMAIL/RMS_TEST_USER_PASSWORD/RMS_TEST_ITEM_ID")

test("create a batch, confirm it, then delete it", async ({ page }) => {
    await page.goto("/test-login")
    await page.getByLabel("Email:").fill(TEST_EMAIL!)
    await page.getByLabel("Password:").fill(TEST_PASSWORD!)
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page).toHaveURL(/\/dashboard/)

    const batchName = `E2E Batch ${Date.now()}`

    await page.goto("/batches")
    await page.getByRole("button", { name: "Create batch" }).click()
    const createDialog = page.getByRole("dialog", { name: "Create batch" })
    await expect(createDialog).toBeVisible()
    await createDialog.getByLabel("Name").fill(batchName)
    await createDialog.getByLabel("Item IDs (comma or space-separated)").fill(TEST_ITEM_ID!)

    try {
        await Promise.all([
            page.waitForResponse((response) => response.request().method() === "POST"),
            createDialog.getByRole("button", { name: "Create batch" }).click(),
        ])
        await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 15000 })

        const batchLink = page.getByRole("link", { name: batchName })
        await expect(batchLink).toBeVisible({ timeout: 15000 })
        await batchLink.click()

        await expect(page).toHaveURL(new RegExp(`/batches/${encodeURIComponent(batchName)}`))
        await expect(page.getByRole("link", { name: TEST_ITEM_ID! })).toBeVisible({ timeout: 15000 })

        await page.getByRole("button", { name: "Delete batch" }).click()
        const deleteDialog = page.getByRole("dialog", { name: "Delete batch?" })
        await expect(deleteDialog).toBeVisible()
        await Promise.all([
            page.waitForResponse((response) => response.request().method() === "POST"),
            deleteDialog.getByRole("button", { name: "Confirm delete" }).click(),
        ])

        await expect(page).toHaveURL(/\/batches$/, { timeout: 15000 })
        await expect(page.getByRole("link", { name: batchName })).toHaveCount(0)
    } finally {
        // Best-effort cleanup: if an earlier assertion failed before the batch got deleted,
        // don't leave it stuck around for later runs.
        await page.goto(`/batches/${encodeURIComponent(batchName)}`).catch(() => undefined)
        const deleteButton = page.getByRole("button", { name: "Delete batch" })
        if (await deleteButton.isVisible().catch(() => false)) {
            await deleteButton.click()
            const confirmButton = page.getByRole("button", { name: "Confirm delete" })
            if (await confirmButton.isVisible().catch(() => false)) {
                await confirmButton.click()
            }
        }
    }
})
