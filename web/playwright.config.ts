import { defineConfig } from "@playwright/test"

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: false,
    // fullyParallel:false only serializes tests *within* one file --
    // separate spec files still run concurrently on separate workers by
    // default. Multiple specs share the same seeded test item
    // (RMS_TEST_ITEM_ID) and mutate its state (borrow/return, reserve),
    // so cross-file parallelism is a real race, not just a slowdown.
    workers: 1,
    retries: 1,
    reporter: "list",
    use: {
        baseURL: process.env.RMS_WEB_BASE_URL ?? "http://localhost:3000",
        trace: "on-first-retry",
    },
})
