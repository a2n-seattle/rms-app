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
    await page.goto("/test-login")
    await page.getByLabel("Email:").fill(TEST_EMAIL!)
    await page.getByLabel("Password:").fill(TEST_PASSWORD!)
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page).toHaveURL(/\/browse/)

    const familyName = `E2E CRUD Family ${Date.now()}`

    await page.getByRole("link", { name: "Add item" }).click()
    await expect(page).toHaveURL(/\/items\/new/)
    await page.getByLabel("Name", { exact: true }).fill(familyName)
    await page.getByLabel("Location").fill("Original Location")

    const [createResponse] = await Promise.all([
        page.waitForResponse((response) => response.request().method() === "POST"),
        page.getByRole("button", { name: "Create item" }).click(),
    ])
    expect(createResponse.ok(), `create item failed with status ${createResponse.status()}`).toBe(true)

    // createItemAction redirects on success -- lands on the new sub-item's own detail page
    // (/items/{familyId}/{subItemId}), since AddItem's returned id is the sub-item id, not
    // the family id.
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
        await Promise.all([
            page.waitForResponse((response) => response.request().method() === "POST"),
            addSubItemDialog.getByRole("button", { name: "Add sub-item" }).click(),
        ])
        await expect(page.getByText(`${familyName} 2`)).toBeVisible({ timeout: 15000 })

        // Edit the family's location.
        await page.getByRole("button", { name: "Edit item" }).click()
        await expect(page.getByRole("dialog", { name: "Edit item" })).toBeVisible()
        await page.locator('input[name="location"]').fill("Updated Location")
        await Promise.all([
            page.waitForResponse((response) => response.request().method() === "POST"),
            page.getByRole("button", { name: "Save" }).click(),
        ])
        await expect(page.getByRole("dialog")).toHaveCount(0)
        await expect(page.getByText("Updated Location")).toBeVisible({ timeout: 15000 })

        // Edit the second sub-item's friendly name.
        const secondRowEdit = page.getByRole("button", { name: `Edit ${familyName} 2` })
        await secondRowEdit.click()
        await expect(page.getByRole("dialog", { name: "Edit sub-item" })).toBeVisible()
        await page.locator('input[name="name"]').fill("Renamed Sub-item")
        await Promise.all([
            page.waitForResponse((response) => response.request().method() === "POST"),
            page.getByRole("button", { name: "Save" }).click(),
        ])
        await expect(page.getByRole("dialog")).toHaveCount(0)
        await expect(page.getByText("Renamed Sub-item")).toBeVisible({ timeout: 15000 })

        // Delete the first sub-item (not the last, so the family survives).
        const firstRowEdit = page.getByRole("button", { name: `Edit ${familyName} 1` })
        await firstRowEdit.click()
        await page.getByRole("button", { name: "Delete sub-item" }).click()
        await Promise.all([
            page.waitForResponse((response) => response.request().method() === "POST"),
            page.getByRole("button", { name: "Confirm delete" }).click(),
        ])
        await expect(page.getByRole("dialog")).toHaveCount(0)
        await expect(page.getByText(`${familyName} 1`)).toHaveCount(0)

        // Delete the last remaining sub-item's family entirely -- cascades and redirects to
        // /browse.
        await page.getByRole("button", { name: "Edit item" }).click()
        await page.getByRole("button", { name: "Delete item" }).click()
        await expect(page.getByText(/This will delete 1 sub-item/)).toBeVisible()
        await Promise.all([
            page.waitForResponse((response) => response.request().method() === "POST"),
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

    await expect(page.getByText(familyName)).toHaveCount(0)
})
