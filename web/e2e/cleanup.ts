import { Locator, Page, expect } from "@playwright/test"

/**
 * Returns the fixture item from whichever page it's currently on, handling both ways an
 * item can be borrowed: directly (a plain "Return" button, submits immediately) or via a
 * schedule group (borrowFromSchedule -- BorrowFromSchedule.ts/dashboard.spec.ts's own
 * borrow flow, resource-basket.spec.ts's "Borrow Selected"), which renders "Return" as a
 * *link* to the batched group confirmation page instead, since item.borrowGroupId is set.
 * A locator scoped to role "button" alone never matches that link, which is what silently
 * left the shared fixture item stuck borrowed for later specs after several cleanup
 * attempts in this suite.
 *
 * The nav bar (present on every page) has its own persistent link with the exact
 * accessible name "Return" (href="/return", the multi-select return page) -- a bare
 * `getByRole("link", { name: "Return" })` matches it *and* the item's own group-return
 * link whenever both are on the page, a strict-mode violation that silently resolved as
 * "not found" through waitFor()'s .catch(), which is what actually kept leaving the shared
 * fixture item stuck. Match the group-return link by its href prefix instead, which is
 * unambiguous.
 */
function returnControl(page: Page) {
    return page.getByRole("button", { name: "Return" }).or(page.locator('a[href^="/return-group/"]'))
}

// Locator.isVisible() checks the DOM once and returns immediately -- unlike
// expect(locator).toBeVisible(), it does NOT wait/retry for the element to appear, even
// when passed a `timeout` option (that only bounds how long it waits for the element to
// be *attached*, not visible). Using it standalone right after a fresh navigation raced
// ahead of the page's own hydration, so a control that was genuinely about to render read
// as absent and cleanup silently skipped it -- exactly what left the shared fixture item
// stuck borrowed. waitFor() actually polls.
export async function waitVisible(locator: Locator, timeout = 15000): Promise<boolean> {
    return locator
        .waitFor({ state: "visible", timeout })
        .then(() => true)
        .catch(() => false)
}

/** Whether the fixture item is currently borrowed, on whichever item detail page `page` is on. */
export async function isBorrowed(page: Page, timeout = 15000): Promise<boolean> {
    return waitVisible(returnControl(page), timeout)
}

/**
 * Resolves the fixture item's family id from its sub-item id. items/[id]/page.tsx redirects
 * /items/{id} to /items/{main.id}/{id} whenever `id` itself isn't the family id, which it
 * never is for RMS_TEST_ITEM_ID (a sub-item id) -- so /items/{subItemId} always lands on the
 * single sub-item page, never the family-level "ResourceBasket" multi-select UI. Visiting
 * /items/{familyId} directly is the only way to reach that page.
 */
export async function resolveFamilyId(page: Page, subItemId: string): Promise<string> {
    await page.goto(`/items/${encodeURIComponent(subItemId)}`)
    const match = new URL(page.url()).pathname.match(/^\/items\/([^/]+)\/([^/]+)$/)
    if (!match) {
        throw new Error(`Expected /items/{subItemId} to redirect to /items/{familyId}/{subItemId}, got ${page.url()}`)
    }
    return decodeURIComponent(match[1])
}

/**
 * Cancels a reservation via its "Cancel" button, scoped to `scope` (an alert or table row
 * locator -- both the "Upcoming" alert banner and the Scheduled tab table render their own
 * DeleteReservationButton for the same schedule.id when a reservation is both upcoming and
 * shown in the Scheduled tab, so an unscoped page-wide lookup would be ambiguous). As of
 * GH-361, "Cancel" opens a confirm dialog (Modal, not portal-based, so it renders as a DOM
 * descendant of wherever the trigger button sits) rather than acting immediately -- a plain
 * click-and-done here would silently leave the reservation in place.
 */
export async function cancelReservation(scope: Locator): Promise<void> {
    const cancelButton = scope.getByRole("button", { name: "Cancel" })
    if (!(await waitVisible(cancelButton))) {
        return
    }
    await cancelButton.click()

    const confirmButton = scope.getByRole("button", { name: "Confirm cancel" })
    if (await waitVisible(confirmButton)) {
        await confirmButton.click()
    }
}

export async function cleanupReturn(page: Page): Promise<void> {
    const returnButton = page.getByRole("button", { name: "Return" })
    if (await waitVisible(returnButton, 2000)) {
        await returnButton.click()
        return
    }

    const returnLink = page.locator('a[href^="/return-group/"]')
    if (!(await waitVisible(returnLink, 15000))) {
        return
    }
    await returnLink.click()
    await expect(page).toHaveURL(/\/return-group\//)

    const confirmButton = page.getByRole("button", { name: /Confirm Return/ })
    // GetBorrowGroup's Scan is eventually consistent (no ConsistentRead) -- loaded right
    // after borrowing, this page can briefly render "Nothing left to return in this
    // group" with zero items. Poll by reloading rather than checking once, same caveat as
    // this suite's other Scan-backed reads.
    try {
        await expect
            .poll(
                async () => {
                    await page.reload()
                    return confirmButton.isVisible()
                },
                { timeout: 15000, intervals: [2000] }
            )
            .toBe(true)
    } catch {
        return
    }

    await Promise.all([page.waitForResponse((response) => response.request().method() === "POST"), confirmButton.click()])
}
