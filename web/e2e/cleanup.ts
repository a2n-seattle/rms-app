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
                { timeout: 15000 }
            )
            .toBe(true)
    } catch {
        return
    }

    await Promise.all([page.waitForResponse((response) => response.request().method() === "POST"), confirmButton.click()])
}
