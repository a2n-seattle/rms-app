# RMS-App

RMS ("Reservation Management System") tracks borrowable/reservable items: item inventory, borrow/return, batches of items, and scheduled reservations. There's also an SMS-based interface (`smsrouter`) for interacting via text.

## Testing policy (standing rule)

**Every change to this repo must include a corresponding test change.** A PR that alters backend or frontend behavior without adding or updating a test is incomplete, not just "missing polish" — treat it the same as a PR that doesn't compile.

- Backend: add/update unit tests under `ts-code/__tests__/unit/` (mirrors `ts-code/src/`) for any change to `src/db/*.ts`, `src/api/*.ts`, or `src/handlers/**/*.ts`. Assert on actual values (new fields, error paths, edge cases), not just "the function ran." `backend-ci.yml` enforces an 80% coverage floor, but passing that floor is necessary, not sufficient — coverage percentage doesn't prove the new logic is exercised correctly.
- Frontend (`web/`, once it exists — see below): add/update Jest + React Testing Library tests (`**/*.test.tsx`) for components and utilities, and Playwright e2e tests (`web/e2e/`) for any new user-facing flow (e.g. a new page or a change to an existing golden path like login → borrow → return).
- This applies to bug fixes too: a bug fix without a regression test that fails on the old code and passes on the new code doesn't demonstrate the bug is actually fixed.

## CI checks policy (standing rule)

**A coding task on this repo isn't done until every check on its PR is green.** After pushing, run `gh pr checks <N>` (or `gh pr checks <N> --watch` to block until they resolve) and treat a red or pending check the same as a failing test — investigate and fix it before reporting the work as complete, don't just note it and move on. This includes third-party checks like CodeFactor, not only `backend-ci.yml`'s build/test/coverage gate. If a check's failure reason isn't visible from `gh` output (e.g. CodeFactor's dashboard requires login to view details), infer the likely cause from the diff itself — e.g. duplicated code across near-identical files is CodeFactor's most common complaint on this repo's "one file per Lambda" CDK pattern (see `amplify-gen2/functions/apiFunction.ts`, a shared helper extracted for exactly this reason) — fix it, push, and re-check rather than leaving it red.

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

## GitHub issue pipeline

Issues filed on this repo flow through three workflow skills in
`.claude/skills/` (`issue-create`, `issue-triage`, and `issue-list`), plus
one plain GitHub Action. These deliberately run as interactive Claude Code
sessions on the user's existing subscription, not `anthropics/claude-code-action`
with a separate `ANTHROPIC_API_KEY`.

Any plan-mode session for work that will likely lead to a code change
should go through `/issue-create` rather than starting plan mode cold —
that's what gets the work tracked as an issue and kept in sync as the plan
iterates. Work that won't produce a code change (answering a question,
explaining existing behavior) skips the pipeline entirely.

**Always branch from `origin/master`, never from whatever branch happens
to be checked out.** This repo's default branch is `master`, not `main` —
double-check before scripting anything that assumes otherwise. A prior
session may have left an unrelated issue's branch checked out; branching
from that instead of `master` silently drags its commits into the new
branch's history. Always `git fetch origin master` first, then
`git checkout -b <new-branch> origin/master`.

- **`/issue-create <text>`** — turns a raw chunk of text (notes, a plan
  draft, a bug description) into a GitHub issue. First checks open issues
  for close overlap — a narrow bar: only if an *existing* issue's plan/scope
  would cover the new text with just a small addition, not merely "related."
  If no overlap, creates a new issue. If there's overlap, rewrites that
  issue's body to incorporate the new scope and posts a comment noting what
  was iterated, rather than creating a duplicate. Either way, hands off to
  `/issue-triage <N>` on the resulting issue in the same session —
  prioritization (`bug`/`idea` + `priority-*` label) happens once, at that
  triage step, not repeated on later plan iterations.
- **`/issue-triage [N]`** — with no issue number, sweeps all open issues:
  classifies `bug`/`idea` (this repo's existing labels — `idea` is the
  feature-request label, not `enhancement`) + a `priority-*` label, and
  posts a feedback/implementation-sketch comment (marked with
  `<!-- issue-triage:v1 -->` so re-runs can detect "already triaged" vs.
  "user replied, needs a revision" vs. "needs first-pass triage").
  Read/comment/label only in this mode — never touches code, never enters
  plan mode. **With an issue number**, it's a two-phase call in the same
  session: first ensures that one issue is triaged (same logic as the
  sweep, scoped to it), then continues straight into plan mode pre-seeded
  with the issue + triage comment (same Explore → Plan → Review → Final
  Plan → ExitPlanMode flow as any other plan-mode session, and the plan
  must account for this repo's testing policy above). As the plan
  iterates, syncs the current draft back to the issue at each phase
  boundary (Review, Final Plan) — updating the issue body and editing a
  single rolling `<!-- issue-plan:v1 -->` comment in place, rather than
  posting a new comment each time — so the session can be paused and picked
  up again later by running `/issue-triage <N>` again in a fresh session
  (it'll skip re-triaging and pick the draft back up), no separate
  "checkpoint" command needed. On approval, creates a branch named
  `GH-<issue-number>/<github-username>/v<n>` (e.g. `GH-42/yauj/v1` — the
  `v<n>` suffix increments per new attempt on the same issue, so a redo
  doesn't collide with or silently overwrite a prior branch) and
  implements, running `npm run build` + `npm run test:unit` before
  considering the work done. Every commit on that branch carries a
  trailing `Refs #<N>` line — deliberately the **non-closing** form
  (GitHub only auto-closes/auto-links on `Fixes`/`Closes`/`Resolves`), so
  merging doesn't auto-close the issue.
- **`/issue-list [N]`** — read-only. No argument lists open issues (number,
  title, labels, last-updated); an issue number shows that issue's body and
  labels only, without fetching the comment thread — for the full
  triage/plan history use `/issue-triage <N>` instead.
- **`.github/workflows/issue-branch-merged.yml`** — triggers on push to
  `master`, no Claude/API involved (pure shell + `gh`). Detects a
  just-merged `GH-<N>/...` branch by name, comments "ready for testing" on
  issue `N`, and applies the `ready-for-testing` label. It does **not**
  close the issue — the user verifies manually and closes it themselves.

`.github/workflows/backend-ci.yml` already runs build + `test:unit` + an
80% coverage gate on every PR to `master` — PR + green CI before merging is
this repo's convention for issue-pipeline branches (`/issue-triage`'s
"Pushing/merging" step), same as it is for any other PR.

**Small fixes that don't warrant a tracked issue** (a docs tweak, a small
bug fix, a one-off cleanup) skip `/issue-create`/`/issue-triage`/plan mode
entirely — make the change directly (including its test, per the testing
policy above), then open the PR with `gh pr create` and a detailed
description of what changed and why. Since there's no pre-existing issue
number to name the branch after, **pre-compute the next PR number before
creating anything**: issues and PRs on a repo share one monotonic counter
(`gh api "repos/<owner>/<repo>/issues?state=all&per_page=1&sort=created&direction=desc" --jq '.[0].number'`
returns the highest number across *both* issues and PRs — GitHub's
`/issues` endpoint includes PRs), so the next number is that value **+ 1**,
as long as nothing else creates an issue/PR in the gap between checking and
creating (a real but narrow race — if it happens, just redo the
rename/PR once more against the actual number). **Always branch from
`origin/master`** (`git fetch origin master` then `git checkout -b ...
origin/master`), never from whatever branch happens to be checked out —
see the callout above. Name and push the branch as
`GH-<predicted-number>/<github-username>/v1` **first**, then run
`gh pr create` from it, and confirm the returned PR number matches.

**Do NOT create the PR first and rename the branch after** — a GitHub PR's
head/source branch is fixed at creation and cannot be retargeted via `gh`
or the API (only the base branch can change). `git branch -m` +
`git push -u origin <new-name>` after the fact just creates a second,
disconnected branch with identical content; the PR keeps pointing at the
old name. If this happens, it forces closing and reopening the PR (which
bumps the number again, so the branch name is now off-by-one from the
*new* PR too) and leaves stray dead branches to clean up
(`git push origin --delete <name>`, after confirming via `gh pr list
--state all --json number,headRefName` that nothing references it).

Commits on a small-fix branch don't need a `Refs #N` trailer (there's no
issue to reference).
