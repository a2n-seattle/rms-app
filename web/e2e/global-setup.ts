import { chromium } from "@playwright/test"

/**
 * Runs once before any spec. `workers: 1` in playwright.config.ts means all specs share one
 * `next start` server, and whichever spec happens to run first alphabetically otherwise pays
 * the cold-start cost of that server's first real login (Amplify/Cognito client's first
 * network round-trip) -- CI's own readiness check only warms the static /login route, not the
 * /test-login sign-in flow every spec's login boilerplate depends on. One real login here
 * absorbs that cost before the timed suite starts (see GH-382).
 */
export default async function globalSetup(): Promise<void> {
    const email = process.env.RMS_TEST_USER_EMAIL
    const password = process.env.RMS_TEST_USER_PASSWORD
    if (!email || !password) {
        return
    }
    const baseURL = process.env.RMS_WEB_BASE_URL ?? "http://localhost:3000"

    const browser = await chromium.launch()
    try {
        const page = await browser.newPage()
        await page.goto(`${baseURL}/test-login`)
        await page.getByLabel("Email:").fill(email)
        await page.getByLabel("Password:").fill(password)
        await page.getByRole("button", { name: "Sign in" }).click()
        await page.waitForURL(/\/dashboard/, { timeout: 30000 })
    } catch (error) {
        // Warmup is best-effort -- if it fails, let the real suite run anyway rather than
        // failing the whole job over a warmup that isn't itself a test.
        console.warn("e2e global-setup warmup login did not complete:", error)
    } finally {
        await browser.close()
    }
}
