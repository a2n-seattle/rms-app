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
    // Default 30s is too tight for these specs: several chain multiple
    // expect.poll()s (each already given its own 15s budget for real,
    // eventually-consistent Scan-based reads against the deployed alpha
    // backend) within a single test, whose worst-case sum alone can exceed
    // 30s even when everything is working correctly.
    timeout: 60000,
    use: {
        baseURL: process.env.RMS_WEB_BASE_URL ?? "http://localhost:3000",
        trace: "on-first-retry",
    },
})
