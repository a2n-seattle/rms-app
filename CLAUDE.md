# RMS-App

RMS ("Reservation Management System") tracks borrowable/reservable items: item inventory, borrow/return, batches of items, and scheduled reservations. There's also an SMS-based interface (`smsrouter`) for interacting via text.

## Testing policy (standing rule)

**Every change to this repo must include a corresponding test change.** A PR that alters backend or frontend behavior without adding or updating a test is incomplete, not just "missing polish" — treat it the same as a PR that doesn't compile.

- Backend: add/update unit tests under `ts-code/__tests__/unit/` (mirrors `ts-code/src/`) for any change to `src/db/*.ts`, `src/api/*.ts`, or `src/handlers/**/*.ts`. Assert on actual values (new fields, error paths, edge cases), not just "the function ran." `backend-ci.yml` enforces an 80% coverage floor, but passing that floor is necessary, not sufficient — coverage percentage doesn't prove the new logic is exercised correctly.
- Frontend (`web/`, once it exists — see below): add/update Jest + React Testing Library tests (`**/*.test.tsx`) for components and utilities, and Playwright e2e tests (`web/e2e/`) for any new user-facing flow (e.g. a new page or a change to an existing golden path like login → borrow → return).
- This applies to bug fixes too: a bug fix without a regression test that fails on the old code and passes on the new code doesn't demonstrate the bug is actually fixed.

## Backend: AWS Amplify (Cognito + Lambda + DynamoDB)

**Migration in progress: Gen 1 (CLI/CloudFormation) → Gen 2 (code-first `ampx`/CDK).** See `.claude/plans/can-you-make-a-shimmying-crane.md` for the full plan. `amplify/` is currently the Gen 1 tree (still live, still deployed to the `alpha` environment); `amplify-gen2/` is the Gen 2 rebuild in progress, not yet deployed to `alpha`. Until the migration's Phase 6 completes, treat `amplify/backend/*` as the source of truth for what's actually running.

No traditional server framework or ORM — auth via Cognito, compute via Lambda, storage via DynamoDB (raw AWS SDK v3 calls). Business logic lives in a **shared `ts-code/` directory at the repo root** (moved out of `amplify/` since it's consumed by both the Gen 1 and Gen 2 builds, not specific to either):

```
ts-code/
  src/
    db/          Schemas.ts (data model) + one *Table.ts per table (DynamoDB access layer)
    api/          business logic, one class per operation (AddItem, BorrowItem, GetItem, ...)
    handlers/api/ thin Lambda entrypoints — each wraps the matching api/*.ts class
    handlers/router/  SMS router entrypoint
    injection/    DI wiring (DB client, metrics client)
    metrics/      CloudWatch metrics helper
  __tests__/
    unit/          mirrors src/ — one *.test.ts per source file
    integration/   Amplify.test.ts (runs against a deployed env)
  __dev__/        local mocks/fixtures for running against a fake DB (not the test suite itself)

amplify/                   # Gen 1 (live, deployed to alpha)
  backend/
    auth/rms42689182/       Cognito User Pool config (CFN) — pool itself has been deleted from alpha
    function/<Name>/        one dir per deployed Lambda (generated/copied output, not hand-edited)
    storage/{main,items,tags,batch,history,schedule,transactions}/   DynamoDB tables (CFN)
    storage/rms/             S3 bucket (CFN)
    backend-config.json      resource wiring / dependency graph

amplify-gen2/               # Gen 2 rebuild (in progress, not yet deployed)
  backend.ts                 entry point: defineBackend({ auth, ...functions })
  auth/resource.ts            defineAuth (fresh pool — Gen 1's pool was deleted, nothing to reference)
  storage/tables.ts           plain CDK dynamodb.Table constructs for all 7 tables
  functions/<kebab-name>/resource.ts   one CDK Lambda construct per function
```

**`ts-code/src/` is the real source of truth** for both trees. Nothing under `amplify/backend/function/*/src/` or `amplify-gen2/functions/*/build/` should be hand-edited — both are generated output:
- `backend-build.js` compiles `ts-code` (via `tsconfig.gen1.json`) and distributes output into each Gen 1 Lambda's folder.
- `backend-build-gen2.js` compiles the same `ts-code` and distributes output into each Gen 2 function's `build/` directory (used by `amplify-gen2/functions/*/resource.ts`'s `lambda.Code.fromAsset(...)`).

**Data model**: see `ts-code/src/db/Schemas.ts` for `MainSchema`, `ItemsSchema`, `TagsSchema`, `BatchSchema`, `HistorySchema`, `ScheduleSchema`, `TransactionsSchema`. DynamoDB is schemaless — these TypeScript interfaces are the *only* schema enforcement that exists, so keeping them accurate and keeping every read/write site in sync with them matters more than it would with a real DB schema. Note: 6 of 7 tables share an identical shape (partition key `id`, streams enabled); `transactions` is the outlier (partition key `number`, no streams) — any table-definition code must special-case it.

**No HTTP API currently exists.** `backend-config.json`'s `"api"` block is empty (an older GraphQL/AppSync API was removed). Lambdas are not currently reachable over HTTP.

**smsrouter has no SNS trigger wired up.** The phone number for the old SMS flow is lost; the Gen 2 `smsrouter` function deploys as a plain Lambda with no subscription. Rebuilding SMS routing (new phone number, new Pinpoint/SNS setup) is separate future work.

### Commands

- `npm run build` — compiles `ts-code` (Gen 1 target) and distributes output into each Gen 1 Lambda's function folder (`backend-build.js`). Run this after any `ts-code` change to catch compile errors before testing.
- `npm run build:gen2` — compiles `ts-code` (Gen 2 target) and distributes output into each `amplify-gen2/functions/*/build/` directory (`backend-build-gen2.js`).
- `npm run test:unit` — runs Jest against the *compiled* unit tests (`amplify/ts-output/__tests__/unit/**/*.test.js`, produced by `npm run build`), with fake DynamoDB table-name env vars injected (`backend-unit-test.js`). Run `npm run build` first, or the tests run against stale output.
- `npm run test:integ` — integration tests against a live deployed Amplify environment (`backend-integ-test.js`).
- `npm run test` — full suite (`backend-test.js`).

### CI/CD

- `.github/workflows/backend-ci.yml` — PRs to `master`: build + `test:unit`, 80% coverage gate.
- `.github/workflows/backend-cd.yml` — push to `master` touching `amplify/**`: `amplify push` to the `alpha` env, then `test:integ`. Still targets Gen 1 — will be updated to `ampx pipeline-deploy` in the migration's Phase 5.
- `.github/workflows/backend-canary.yml` — hourly smoke test against the deployed `alpha` env.

None of these currently touch a frontend — there is no frontend build/deploy step yet.

## Frontend

An old React Native/Expo app lives at `frontend/` but hasn't been touched since 2021 and is not built or deployed by CI — treat it as abandoned reference material, not living code.

A new Node.js web frontend (Next.js) is planned under `web/`, authenticating via Google Workspace SSO (Cognito federated with Google, restricted to the Acts2 Network org) and calling the backend through a new API Gateway REST layer. See the project plan for the phased rollout. This section will be filled in as `web/` is built out.
