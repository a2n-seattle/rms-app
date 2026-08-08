import { test, expect } from "@playwright/test"

/**
 * Item/sub-item CRUD (GH-363): login -> create a new item (family + first
 * sub-item) -> confirm the default numbered friendly name -> add a second
 * sub-item -> confirm its default numbering -> edit the family -> edit a
 * sub-item's friendly name -> delete one sub-item -> delete the remaining
 * sub-item (cascades to family deletion) -> confirm it's gone from
 * /browse.
 *
 * Unlike most specs in this suite, this one creates and must clean up its
 * *own* family/sub-items -- it does not touch the shared RMS_TEST_ITEM_ID
 * fixture every other spec relies on, so it only needs login credentials.
 * Run against the real deployed `alpha` environment (same philosophy as
 * golden-path.spec.ts).
 */
const TEST_EMAIL = process.env.RMS_TEST_USER_EMAIL
const TEST_PASSWORD = process.env.RMS_TEST_USER_PASSWORD

test.skip(!TEST_EMAIL || !TEST_PASSWORD, "Missing RMS_TEST_USER_EMAIL/RMS_TEST_USER_PASSWORD")

test("create, edit, and delete an item and its sub-items", async ({ page }) => {
    // This flow invokes four distinct Lambdas (AddItem, UpdateItem, UpdateSubItem, DeleteItem)
    // for the first time in this run -- generous per-step cold-start allowances below can add
    // up past the suite's default 60s test timeout, so extend this specific test.
    test.setTimeout(120000)

    await page.goto("/test-login")
    await page.getByLabel("Email:").fill(TEST_EMAIL!)
    await page.getByLabel("Password:").fill(TEST_PASSWORD!)
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page).toHaveURL(/\/dashboard/)

    const familyName = `E2E CRUD Family ${Date.now()}`

    await page.goto("/browse")
    await page.getByRole("link", { name: "Add item" }).click()
    await expect(page).toHaveURL(/\/items\/new/)
    await page.getByLabel("Name", { exact: true }).fill(familyName)
    await page.getByLabel("Location").fill("Original Location")

    // createItemAction redirects on success (a 303, not a 2xx -- response.ok() would be
    // false even on success, so just wait for the POST round-trip rather than asserting on
    // its status) -- lands on the new sub-item's own detail page
    // (/items/{familyId}/{subItemId}), since AddItem's returned id is the sub-item id, not
    // the family id.
    const createItemUrl = page.url()
    await Promise.all([
        page.waitForResponse((response) => response.request().method() === "POST" && response.url() === createItemUrl),
        page.getByRole("button", { name: "Create item" }).click(),
    ])
    await expect(page).toHaveURL(/\/items\/[^/]+\/[^/]+/)
    const match = new URL(page.url()).pathname.match(/^\/items\/([^/]+)\/([^/]+)$/)
    if (!match) {
        throw new Error(`Expected /items/{familyId}/{subItemId}, got ${page.url()}`)
    }
    const familyId = decodeURIComponent(match[1])

    try {
        await expect(page.getByText(`${familyName} 1`)).toBeVisible({ timeout: 15000 })

        // Add a second sub-item from the family page, confirm it gets the next numbered default.
        await page.goto(`/items/${encodeURIComponent(familyId)}`)
        await page.getByRole("button", { name: "Add sub-item" }).click()
        const addSubItemDialog = page.getByRole("dialog", { name: "Add sub-item" })
        await expect(addSubItemDialog).toBeVisible()
        const addSubItemUrl = page.url()
        await Promise.all([
            page.waitForResponse((response) => response.request().method() === "POST" && response.url() === addSubItemUrl),
            addSubItemDialog.getByRole("button", { name: "Add sub-item" }).click(),
        ])
        await expect(page.getByText(`${familyName} 2`)).toBeVisible({ timeout: 15000 })

        // Edit the family's location. This is UpdateItem's first-ever invocation in this
        // environment (unlike AddItem, already warm from the create + add-sub-item steps
        // above) -- give its cold start + the subsequent revalidation re-fetch extra room.
        await page.getByRole("button", { name: "Edit item" }).click()
        await expect(page.getByRole("dialog", { name: "Edit item" })).toBeVisible()
        await page.locator('input[name="location"]').fill("Updated Location")
        const editItemUrl = page.url()
        await Promise.all([
            page.waitForResponse((response) => response.request().method() === "POST" && response.url() === editItemUrl),
            page.getByRole("button", { name: "Save" }).click(),
        ])
        await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 30000 })
        await expect(page.getByText("Updated Location")).toBeVisible({ timeout: 15000 })

        // Edit the second sub-item's friendly name -- UpdateSubItem's first-ever invocation
        // here too, same cold-start rationale as the family edit above.
        const secondRowEdit = page.getByRole("button", { name: `Edit ${familyName} 2` })
        await secondRowEdit.click()
        await expect(page.getByRole("dialog", { name: "Edit sub-item" })).toBeVisible()
        await page.locator('input[name="name"]').fill("Renamed Sub-item")
        const editSubItemUrl = page.url()
        await Promise.all([
            page.waitForResponse((response) => response.request().method() === "POST" && response.url() === editSubItemUrl),
            page.getByRole("button", { name: "Save" }).click(),
        ])
        await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 30000 })
        await expect(page.getByText("Renamed Sub-item")).toBeVisible({ timeout: 15000 })

        // Delete the first sub-item (not the last, so the family survives).
        const firstRowEdit = page.getByRole("button", { name: `Edit ${familyName} 1` })
        await firstRowEdit.click()
        await page.getByRole("button", { name: "Delete sub-item" }).click()
        const deleteSubItemUrl = page.url()
        await Promise.all([
            page.waitForResponse((response) => response.request().method() === "POST" && response.url() === deleteSubItemUrl),
            page.getByRole("button", { name: "Confirm delete" }).click(),
        ])
        await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 15000 })
        await expect(page.getByText(`${familyName} 1`)).toHaveCount(0, { timeout: 15000 })

        // Delete the last remaining sub-item's family entirely -- cascades and redirects to
        // /browse.
        await page.getByRole("button", { name: "Edit item" }).click()
        await page.getByRole("button", { name: "Delete item" }).click()
        await expect(page.getByText(/This will delete 1 sub-item/)).toBeVisible()
        const deleteItemUrl = page.url()
        await Promise.all([
            page.waitForResponse((response) => response.request().method() === "POST" && response.url() === deleteItemUrl),
            page.getByRole("button", { name: "Confirm delete" }).click(),
        ])
        await expect(page).toHaveURL(/\/browse/, { timeout: 15000 })
    } finally {
        // Best-effort cleanup: if an earlier assertion failed before the family got deleted,
        // don't leave it stuck around for later runs -- deleting every remaining sub-item
        // cascades to removing the family row too (same mechanism the test itself exercises).
        await page.goto(`/items/${encodeURIComponent(familyId)}`).catch(() => undefined)
        const editButton = page.getByRole("button", { name: "Edit item" })
        if (await editButton.isVisible().catch(() => false)) {
            await editButton.click()
            const deleteButton = page.getByRole("button", { name: "Delete item" })
            if (await deleteButton.isVisible().catch(() => false)) {
                await deleteButton.click()
                const confirmButton = page.getByRole("button", { name: "Confirm delete" })
                if (await confirmButton.isVisible().catch(() => false)) {
                    await confirmButton.click()
                }
            }
        }
    }

    await expect(page.getByText(familyName)).toHaveCount(0, { timeout: 15000 })
})
