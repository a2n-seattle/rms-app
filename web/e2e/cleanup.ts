import { Page, expect } from "@playwright/test"

/**
 * Returns the fixture item from whichever page it's currently on, handling both ways an
 * item can be borrowed: directly (a plain "Return" button, submits immediately) or via a
 * schedule group (borrowFromSchedule -- BorrowFromSchedule.ts/dashboard.spec.ts's own
 * borrow flow, resource-basket.spec.ts's "Borrow Selected"), which renders "Return" as a
 * *link* to the batched group confirmation page instead, since item.borrowGroupId is set.
 * A locator scoped to role "button" alone never matches that link, which is what silently
 * left the shared fixture item stuck borrowed for later specs after several cleanup
 * attempts in this suite.
 */
function returnControl(page: Page) {
    return page.getByRole("button", { name: "Return" }).or(page.getByRole("link", { name: "Return" }))
}

/** Whether the fixture item is currently borrowed, on whichever item detail page `page` is on. */
export async function isBorrowed(page: Page, timeout = 15000): Promise<boolean> {
    return returnControl(page)
        .isVisible({ timeout })
        .catch(() => false)
}

export async function cleanupReturn(page: Page): Promise<void> {
    const returnButton = page.getByRole("button", { name: "Return" })
    if (await returnButton.isVisible({ timeout: 15000 }).catch(() => false)) {
        await returnButton.click()
        return
    }

    const returnLink = page.getByRole("link", { name: "Return" })
    if (await returnLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await returnLink.click()
        await expect(page).toHaveURL(/\/return-group\//)
        const confirmButton = page.getByRole("button", { name: /Confirm Return/ })
        if (await confirmButton.isVisible({ timeout: 15000 }).catch(() => false)) {
            await Promise.all([page.waitForResponse((response) => response.request().method() === "POST"), confirmButton.click()])
        }
    }
}
