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
    // No automatic retry: this repo's `items`/`schedule` DynamoDB tables are deliberately
    // provisioned at 1 RCU/1 WCU (see root CLAUDE.md), and a retried test re-runs its
    // entire borrow/reserve/poll flow from scratch -- confirmed via a captured server log
    // that this suite's read volume alone can throttle those tables
    // (ProvisionedThroughputExceededException), and a retry only compounds that read
    // pressure on top of whatever caused the first failure. Every spec already cleans up
    // after itself via try/finally, so a single failed attempt doesn't need a retry to
    // leave state usable for the next spec.
    retries: 0,
    reporter: "list",
    // Default 30s is too tight for these specs: several chain multiple
    // expect.poll()s (each already given its own 15s budget for real,
    // eventually-consistent Scan-based reads against the deployed alpha
    // backend) within a single test, whose worst-case sum alone can exceed
    // 30s even when everything is working correctly.
    timeout: 60000,
    use: {
        baseURL: process.env.RMS_WEB_BASE_URL ?? "http://localhost:3000",
        // retain-on-failure (not on-first-retry) since retries are off above -- still want
        // a trace from the one attempt each test gets.
        trace: "retain-on-failure",
    },
})
