# RMS-App

RMS ("Reservation Management System") tracks borrowable/reservable items: item inventory, borrow/return, batches of items, and scheduled reservations. There's also an SMS-based interface (`smsrouter`) for interacting via text.

## Local CLI access: GitHub and AWS (environment-dependent, self-diagnose first)

Claude Code sessions on this repo can often merge PRs, manage GitHub Actions secrets/environments, and query real deployed AWS infrastructure (Cognito, DynamoDB, Lambda, CloudWatch logs, Amplify Hosting) directly via the `gh` and `aws` CLIs. **This access is a property of the local machine/shell the session is running in, not something built into Claude Code itself or this repo's config** — a session on a different machine, or a fresh shell without the setup below, will not have it, and that's expected rather than a bug. If `gh`/`aws` commands are failing, self-diagnose with the commands below before assuming something is broken.

**GitHub (`gh`)**: authenticates via `gh`'s own persisted OAuth login (stored in the OS keychain), not an env var — `gh auth status` shows the logged-in account, token scopes, and whether it's active. `gh api user --jq .login` confirms the identity; `gh api repos/<owner>/<repo> --jq .permissions` shows the actual permission level (`admin: true` is what allows `gh pr merge --admin` to bypass branch protection — it works because the authenticated account genuinely has admin rights on the repo, not because of any special token). If `gh auth status` shows not-logged-in, or the repo permissions come back without `push`/`admin`, merges and other write actions will fail — that's a local auth/account issue, not a code or repo-config problem, and the fix is `gh auth login` (interactive) or confirming the right account is active with `gh auth switch`.

**AWS (`aws`)**: **not** on by default in a fresh shell — there's no ambient `AWS_PROFILE` or credentials env var set globally. Every `aws` command in this repo's sessions needs `AWS_PROFILE=rms-alpha` set explicitly (e.g. `export AWS_PROFILE=rms-alpha` once per shell, or prefixed per-command: `AWS_PROFILE=rms-alpha aws sts get-caller-identity`) — a bare `aws ...` call with no profile set fails with `NoCredentials`. The `rms-alpha` profile (`~/.aws/config` / `~/.aws/credentials`) holds **static, long-lived IAM user credentials** (`arn:aws:iam::<account>:user/laptop`, region `us-west-2`) — not an SSO session, so there's no `aws sso login` step and no expiry to worry about; if `aws sts get-caller-identity` fails even with the profile set, the credentials themselves may have been rotated/revoked, which is a local-machine issue to resolve outside of any Claude Code session (regenerate/re-save the key pair), not something a session can fix by retrying.

**Self-diagnosis pattern for any session**: before assuming a `gh`/`aws` capability doesn't exist or is broken, run the identity/permission check first (`gh auth status` + `gh api user`, or `export AWS_PROFILE=rms-alpha && aws sts get-caller-identity`) and report the actual result — "no credentials configured in this shell" and "credentials configured but access denied" are different problems with different fixes, and neither should be assumed without checking.

## Branching and environment promotion (standing rule)

**`alpha` is this repo's default branch and the merge target for all PRs** — not `master`. Every backend/frontend CI workflow (`backend-ci.yml`, `frontend-ci.yml`) gates PRs against `alpha`, and `backend-cd.yml` deploys on push to `alpha`. The issue pipeline (below) branches from `origin/alpha`, not `origin/master`.

The intended long-term model is a promotion chain: **`alpha` → `beta` → `master`**, where each stage is a real deployed environment (own Amplify Hosting branch, own backend deploy). `master` is the **production** branch — the promotion *destination*, not the source of truth for active development. Each stage is meant to eventually fan out to multiple per-city branches (e.g. `beta`'s and `master`'s work will expand into one branch per church/city once the multi-tenant rollout — tracked separately, see the "Not in scope" note on the frontend epic — is built out); for now, only `alpha` exists as a real environment.

**Today, only `alpha` is provisioned** (the Amplify app, Cognito pool, DynamoDB tables, etc. described below). `beta` and `master`/production have no infrastructure yet — don't treat `master` as deployable until that's built.

**Promotion between stages is a manual, deliberate action, not automatic.** Run the **"Promote environment branch"** workflow (`.github/workflows/promote.yml`, triggered via `workflow_dispatch` — GitHub Actions tab, or `gh workflow run promote.yml -f target=master`) once you've verified a change in `alpha` and are ready to ship it further. It fast-forwards the target branch (`beta` or `master`) to the source branch's current HEAD (`alpha`, or eventually `beta` once that stage exists) — it does not itself deploy anything; pushing to the target branch is what triggers that branch's own CD workflow. Attempting to promote to `beta` today fails fast with a clear error, since there's no `beta` environment yet to promote into. When `beta` is provisioned, update `promote.yml`'s source-branch mapping so `master` promotes from `beta` instead of directly from `alpha`, keeping the full chain intact.

## Testing policy (standing rule)

**Every change to this repo must include a corresponding test change.** A PR that alters backend or frontend behavior without adding or updating a test is incomplete, not just "missing polish" — treat it the same as a PR that doesn't compile.

- Backend: add/update unit tests under `ts-code/__tests__/unit/` (mirrors `ts-code/src/`) for any change to `src/db/*.ts`, `src/api/*.ts`, or `src/handlers/**/*.ts`. Assert on actual values (new fields, error paths, edge cases), not just "the function ran." `backend-ci.yml` enforces an 80% coverage floor, but passing that floor is necessary, not sufficient — coverage percentage doesn't prove the new logic is exercised correctly.
- Frontend (`web/`, once it exists — see below): add/update Jest + React Testing Library tests (`**/*.test.tsx`) for components and utilities, and Playwright e2e tests (`web/e2e/`) for any new user-facing flow (e.g. a new page or a change to an existing golden path like login → borrow → return).
- This applies to bug fixes too: a bug fix without a regression test that fails on the old code and passes on the new code doesn't demonstrate the bug is actually fixed.

## CI checks policy (standing rule)

**A coding task on this repo isn't done until every check on its PR is green.** After pushing, run `gh pr checks <N>` (or `gh pr checks <N> --watch` to block until they resolve) and treat a red or pending check the same as a failing test — investigate and fix it before reporting the work as complete, don't just note it and move on. This includes third-party checks like CodeFactor, not only `backend-ci.yml`'s build/test/coverage gate. If a check's failure reason isn't visible from `gh` output (e.g. CodeFactor's dashboard requires login to view details), infer the likely cause from the diff itself — e.g. duplicated code across near-identical files is CodeFactor's most common complaint on this repo's "one file per Lambda" CDK pattern (see `amplify-gen2/functions/apiFunction.ts`, a shared helper extracted for exactly this reason) — fix it, push, and re-check rather than leaving it red.

## Deploy verification policy (standing rule)

**Don't run `ampx sandbox` to pre-verify infra changes before merging.** It provisions a separate, real CloudFormation stack that then needs manual teardown (`ampx sandbox delete`) — extra live-infra risk for a check the normal pipeline already does. Instead: merge once CI is green (build + `test:unit` + coverage floor + CodeFactor, per the CI checks policy above), let `backend-cd.yml` deploy the merge to the real `alpha` environment and run `npm run test:integ` against it, and treat that post-merge integration-test result as the actual verification — not something to reproduce locally first.

**Don't close the GitHub issue for infra/backend changes until the post-merge integration test has actually passed.** A green PR (unit tests + typecheck + CodeFactor) shows the code compiles and its unit-level logic is correct, not that the change works against the real deployed `alpha` stack — only `test:integ` running after `backend-cd.yml`'s deploy confirms that. After merging, check `backend-cd.yml`'s run (`gh run list --workflow=backend-cd.yml` / `gh run view <run-id>`) for the deploy + integ-test result before telling the user it's safe to close the issue.

**Known gap: `amplify/**` changes that affect `amplify_outputs.json`'s content (e.g. Cognito `callbackUrls`) can race against Amplify Hosting's own build.** A push to `alpha` touching `amplify/**` triggers `backend-cd.yml` (deploys the actual CDK/Cognito change) and Amplify Hosting's own build (runs `amplify.yml`'s `ampx generate outputs`, baking the result into `web/`'s frontend JS bundle at build time) independently and simultaneously — there's no ordering between them. If Hosting's build wins the race, it bakes in the *pre-change* config, and the live site silently serves stale values (e.g. an old OAuth callback URL) even though the backend itself deployed correctly and `backend-cd.yml` reports success. This is narrow (only matters when the `amplify/**` change actually alters `amplify_outputs.json`'s content, not e.g. a Lambda IAM policy tweak), so no automated fix exists yet — if a live-site value looks stale right after this kind of change, verify the deployed JS bundle directly (`curl` the site's `_next/static/chunks/*.js` and grep for the relevant config key) rather than trusting `backend-cd.yml`'s success alone, and manually re-trigger a fresh Hosting build once the backend deploy has settled: `aws amplify start-job --app-id <id> --branch-name alpha --job-type RELEASE`.

## Backend: AWS Amplify (Cognito + Lambda + DynamoDB)

**Gen 1 → Gen 2 migration complete.** The backend runs on Amplify Gen 2 (code-first `ampx`/CDK), live in the `alpha` environment. `amplify/` is the single, current backend tree — there is no separate Gen 1 tree anymore (it was decommissioned; its live per-function CloudFormation stacks were deleted directly in AWS, and the local `amplify-gen1/` tree was removed from the repo). `.claude/plans/can-you-make-a-shimmying-crane.md` has historical detail on how the migration happened, if useful, but `amplify/backend.ts` is simply the source of truth for what's running now — no "which tree is live" ambiguity to track.

No traditional server framework or ORM — auth via Cognito, compute via Lambda, storage via DynamoDB (raw AWS SDK v3 calls, tables referenced by ARN from CDK rather than CDK-managed — see below). Business logic lives in a **shared `ts-code/` directory at the repo root**:

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
    integration/   Amplify.test.ts (runs against the deployed alpha env)
  __dev__/        local mocks/fixtures for running against a fake DB (not the test suite itself)

resources/seeds/            JSON fixtures used by ts-code/__dev__/db/DBTestConstants.ts

amplify/
  backend.ts                 entry point: defineBackend({ auth, ...functions })
  auth/resource.ts            defineAuth (fresh Cognito pool — Gen 1's pool was deleted, nothing to reference)
  storage/tables.ts           references the 7 live DynamoDB tables by ARN (Table.fromTableArn) — NOT
                               CDK-owned/created. cdk import isn't reachable through ampx's tooling (no
                               cdk.json/CDK CLI app exposed), so this project follows AWS's own pattern
                               for connecting Gen 2 to pre-existing tables rather than trying to import
                               them under CloudFormation management. CloudFormation can't Create/Update/
                               Delete these tables as a result — safe by design, but also means table
                               schema changes (new GSIs, etc.) happen out-of-band, not via this code.
  functions/apiFunction.ts     shared "custom function" CDK construct builder (plain lambda.Function,
                               not NodejsFunction/defineFunction — ts-code is compiled once outside CDK
                               by backend-build-gen2.js, not per-function via esbuild)
  functions/<kebab-name>/resource.ts   one thin wrapper per function calling apiFunction.ts's builder
```

**`ts-code/src/` is the real source of truth.** Nothing under `amplify/functions/*/build/` should be hand-edited — it's generated output, produced by `backend-build-gen2.js` (compiles `ts-code` and fans it out into each function's `build/` directory, consumed by that function's `resource.ts` via `lambda.Code.fromAsset(...)`). `backend-build.js` is a separate, smaller script that compiles the same `ts-code` into repo-root `ts-output/` purely so `npm run test:unit` has compiled JS to run against — it no longer fans output out anywhere (that fan-out was Gen 1-specific, for `amplify push`, which no longer runs).

**Data model**: see `ts-code/src/db/Schemas.ts` for `MainSchema`, `ItemsSchema`, `TagsSchema`, `BatchSchema`, `HistorySchema`, `ScheduleSchema`, `TransactionsSchema`. DynamoDB is schemaless — these TypeScript interfaces are the *only* schema enforcement that exists, so keeping them accurate and keeping every read/write site in sync with them matters more than it would with a real DB schema. Note: 6 of 7 tables share an identical shape (partition key `id`, streams enabled); `transactions` is the outlier (partition key `number`, no streams).

**No HTTP API currently exists.** Lambdas are not currently reachable over HTTP — they're invoked directly (see `ts-code/__tests__/integration/Amplify.test.ts` for the pattern: sign in, exchange for Identity Pool credentials, invoke by function name via `@aws-sdk/client-lambda`).

**smsrouter has no SNS trigger wired up.** The phone number for the old SMS flow is lost; `smsrouter` deploys as a plain Lambda with no subscription. Rebuilding SMS routing (new phone number, new Pinpoint/SNS setup) is separate future work.

### Commands

- `npm run build` — compiles `ts-code` into `ts-output/` (`backend-build.js`). Feeds `test:unit`. Run this after any `ts-code` change to catch compile errors before testing.
- `npm run build:gen2` — compiles `ts-code` and fans it out into each `amplify/functions/*/build/` directory (`backend-build-gen2.js`). Run this after any `ts-code` change that should reach a deployed Lambda.
- `npm run test:unit` — runs Jest against the *compiled* unit tests (`ts-output/__tests__/unit/**/*.test.js`, produced by `npm run build`), with fake DynamoDB table-name env vars injected (`backend-unit-test.js`). Run `npm run build` first, or the tests run against stale output.
- `npm run test:integ` — integration tests against the deployed `alpha` environment (`backend-integ-test.js`).
- `npm run test` — full suite (`backend-test.js`).

### CI/CD

- `.github/workflows/backend-ci.yml` — PRs to `alpha`: build + `test:unit`, 80% coverage gate, plus a `tsc --noEmit -p amplify/tsconfig.json` typecheck step for the CDK code.
- `.github/workflows/backend-cd.yml` — push to `alpha` touching `amplify/**`: `npx ampx pipeline-deploy --branch alpha --app-id ...` to deploy, then `test:integ`.
- `.github/workflows/promote.yml` — manual promotion to `beta`/`master`, see "Branching and environment promotion" above.
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

**Always branch from `origin/alpha`, never from whatever branch happens
to be checked out.** This repo's default branch is `alpha`, not `main` or
`master` — double-check before scripting anything that assumes otherwise
(see "Branching and environment promotion" above). A prior session may
have left an unrelated issue's branch checked out; branching from that
instead of `alpha` silently drags its commits into the new branch's
history. Always `git fetch origin alpha` first, then
`git checkout -b <new-branch> origin/alpha`.

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
  `alpha`, no Claude/API involved (pure shell + `gh`). Detects a
  just-merged `GH-<N>/...` branch by name, comments "ready for testing" on
  issue `N`, and applies the `ready-for-testing` label. It does **not**
  close the issue — the user verifies manually and closes it themselves.

`.github/workflows/backend-ci.yml` already runs build + `test:unit` + an
80% coverage gate on every PR to `alpha` — PR + green CI before merging is
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
`origin/alpha`** (`git fetch origin alpha` then `git checkout -b ...
origin/alpha`), never from whatever branch happens to be checked out —
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
