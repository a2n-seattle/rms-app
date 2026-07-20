# RMS-App

RMS ("Reservation Management System") tracks borrowable/reservable items: item inventory, borrow/return, batches of items, and scheduled reservations. There's also an SMS-based interface (`smsrouter`) for interacting via text.

## Testing policy (standing rule)

**Every change to this repo must include a corresponding test change.** A PR that alters backend or frontend behavior without adding or updating a test is incomplete, not just "missing polish" — treat it the same as a PR that doesn't compile.

- Backend: add/update unit tests under `amplify/ts-code/__tests__/unit/` (mirrors `amplify/ts-code/src/`) for any change to `src/db/*.ts`, `src/api/*.ts`, or `src/handlers/**/*.ts`. Assert on actual values (new fields, error paths, edge cases), not just "the function ran." `backend-ci.yml` enforces an 80% coverage floor, but passing that floor is necessary, not sufficient — coverage percentage doesn't prove the new logic is exercised correctly.
- Frontend (`web/`, once it exists — see below): add/update Jest + React Testing Library tests (`**/*.test.tsx`) for components and utilities, and Playwright e2e tests (`web/e2e/`) for any new user-facing flow (e.g. a new page or a change to an existing golden path like login → borrow → return).
- This applies to bug fixes too: a bug fix without a regression test that fails on the old code and passes on the new code doesn't demonstrate the bug is actually fixed.

## Backend: AWS Amplify (Cognito + Lambda + DynamoDB)

No traditional server framework or ORM — this is a serverless Amplify CLI project (v3.1, project name `rms`), auth via Cognito, compute via Lambda, storage via DynamoDB (raw AWS SDK calls), all wired through Amplify-generated CloudFormation.

```
amplify/
  backend/
    auth/rms42689182/       Cognito User Pool config (CFN)
    function/<Name>/        one dir per deployed Lambda (generated/copied output, not hand-edited)
    storage/{main,items,tags,batch,history,schedule,transactions}/   DynamoDB tables (CFN)
    storage/rms/             S3 bucket (CFN)
    backend-config.json      resource wiring / dependency graph
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
```

**`amplify/ts-code/src/` is the real source of truth.** Nothing under `amplify/backend/function/*/src/` should be hand-edited — it's generated output, copied in per-function by `backend-build.js`, which compiles `ts-code` with `tsc` and distributes the relevant compiled files into each Lambda's folder (shared `db`/`metrics`/`injection` go to every function; each function also gets its own `api/<Name>.js` + `handlers/api/<Name>.js`).

**Data model**: see `amplify/ts-code/src/db/Schemas.ts` for `MainSchema`, `ItemsSchema`, `TagsSchema`, `BatchSchema`, `HistorySchema`, `ScheduleSchema`, `TransactionsSchema`. DynamoDB is schemaless — these TypeScript interfaces are the *only* schema enforcement that exists, so keeping them accurate and keeping every read/write site in sync with them matters more than it would with a real DB schema.

**No HTTP API currently exists.** `backend-config.json`'s `"api"` block is empty (an older GraphQL/AppSync API was removed). Lambdas are not currently reachable over HTTP.

### Commands

- `npm run build` — compiles `amplify/ts-code` via `tsc` and distributes output into each Lambda's function folder (`backend-build.js`). Run this after any `ts-code` change to catch compile errors before testing.
- `npm run test:unit` — runs Jest against the *compiled* unit tests (`amplify/ts-code/__tests__/unit/**/*.test.js`, produced by `npm run build`), with fake DynamoDB table-name env vars injected (`backend-unit-test.js`). Run `npm run build` first, or the tests run against stale output.
- `npm run test:integ` — integration tests against a live deployed Amplify environment (`backend-integ-test.js`).
- `npm run test` — full suite (`backend-test.js`).

### CI/CD

- `.github/workflows/backend-ci.yml` — PRs to `master`: build + `test:unit`, 80% coverage gate.
- `.github/workflows/backend-cd.yml` — push to `master` touching `amplify/**`: `amplify push` to the `alpha` env, then `test:integ`.
- `.github/workflows/backend-canary.yml` — hourly smoke test against the deployed `alpha` env.

None of these currently touch a frontend — there is no frontend build/deploy step yet.

## Frontend

An old React Native/Expo app lives at `frontend/` but hasn't been touched since 2021 and is not built or deployed by CI — treat it as abandoned reference material, not living code.

A new Node.js web frontend (Next.js) is planned under `web/`, authenticating via Google Workspace SSO (Cognito federated with Google, restricted to the Acts2 Network org) and calling the backend through a new API Gateway REST layer. See the project plan for the phased rollout. This section will be filled in as `web/` is built out.
