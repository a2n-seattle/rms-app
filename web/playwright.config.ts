import { defineConfig } from "@playwright/test"

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: false,
    retries: 1,
    reporter: "list",
    use: {
        baseURL: process.env.RMS_WEB_BASE_URL ?? "http://localhost:3000",
        trace: "on-first-retry",
    },
})
