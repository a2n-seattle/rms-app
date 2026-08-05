# rms-app

RMS ("Reservation Management System") tracks borrowable/reservable items:
item inventory, borrow/return, batches of items, and scheduled reservations.
There's also an SMS-based interface (`smsrouter`, currently not wired up to a
phone number) for interacting via text.

The backend runs on **AWS Amplify Gen 2** (Cognito for auth, Lambda for
compute, DynamoDB for storage), with shared business logic in `ts-code/` at
the repo root and infrastructure defined in `amplify/`. The frontend is a
**Next.js** app in `web/`, authenticating via Google Workspace SSO through
Cognito.

See [`CLAUDE.md`](./CLAUDE.md) for the full architecture, data model, CI/CD
workflows, and standing repo policies (testing, branching, deploy
verification) — this README only covers getting a working local setup.

## Prerequisites

- **Node.js** (v20+; this repo has been developed against Node 26 — check
  `node --version`).
- **AWS CLI** (`aws --version`), for interacting with the deployed `alpha`
  environment. Not preinstalled on macOS — `brew install awscli` if
  `aws --version` fails.
- **GitHub CLI** (`gh --version`), for PRs/issues.

## Cloning and installing

```bash
git clone <repo-url>
cd rms-app
npm install        # root: ts-code/, amplify/, and legacy Expo frontend/ deps
cd web
npm install        # web/ is an independent package with its own deps
cd ..
```

## AWS CLI setup

This repo's only currently-provisioned environment is `alpha`, accessed via
an AWS profile named **`rms-alpha`**:

```bash
# ~/.aws/config
[profile rms-alpha]
region = us-west-2
output = json

# ~/.aws/credentials
[rms-alpha]
aws_access_key_id = ...
aws_secret_access_key = ...
```

These are static, long-lived IAM user credentials (not SSO) — ask a
teammate with access for a key pair rather than generating your own from
scratch, so everyone maps to the same IAM user's permissions.

Every `aws` command needs `AWS_PROFILE=rms-alpha` set explicitly — there's
no ambient default profile:

```bash
export AWS_PROFILE=rms-alpha        # once per shell, or prefix per-command
aws sts get-caller-identity         # verify credentials work
```

## GitHub CLI setup

```bash
gh auth login       # interactive OAuth login
gh auth status       # confirm you're logged in and check token scopes
gh api user --jq .login   # confirm identity
```

Merging PRs and managing Actions/secrets requires your GitHub account to
actually have write/admin access on the repo — `gh api repos/<owner>/<repo>
--jq .permissions` shows your real permission level.

## Backend: build and test

Run from the repo root:

```bash
npm run build          # compile ts-code/ -> ts-output/ (feeds test:unit)
npm run build:gen2     # compile ts-code/ and fan it into amplify/functions/*/build/
npm run test:unit      # unit tests against compiled ts-code (run build first)
npm run test:integ     # integration tests against the deployed alpha environment
npm run test           # full suite
```

There is no local backend to run — Lambdas are invoked directly (no HTTP
API yet); local iteration is build + unit test, with real verification
happening post-merge against `alpha` (see CLAUDE.md's "Deploy verification
policy" — don't use `ampx sandbox` to pre-verify).

## Frontend (`web/`): local dev

`web/` imports a generated `web/amplify_outputs.json` (gitignored — it's
build output, not source, per `amplify.yml`) for Cognito/API config. It
doesn't exist on a fresh clone, and `npm run dev`/`build`/`test` in `web/`
all fail without it (`Module not found: Can't resolve
'@/amplify_outputs.json'`). Generate it from the repo root once
`AWS_PROFILE=rms-alpha` is working (see "AWS CLI setup" above) and you have
the deployed `alpha` environment's Amplify app id (ask a teammate, or find
it via `aws amplify list-apps` — it's also stored as the
`GEN2_AMPLIFY_APP_ID` GitHub Actions secret, but secret values aren't
readable via `gh`):

```bash
npx ampx generate outputs --app-id <app-id> --branch alpha --out-dir web
```

Then:

```bash
cd web
npm run dev          # start the Next.js dev server (http://localhost:3000)
npm run test         # Jest + React Testing Library
npm run test:e2e     # Playwright e2e, against a real deployed alpha environment
```

Playwright specs under `web/e2e/` run against the real `alpha` environment
and need these env vars set (ask a teammate for a test account's
credentials and a spare test item's id):

```bash
export RMS_TEST_USER_EMAIL=...
export RMS_TEST_USER_PASSWORD=...
export RMS_TEST_ITEM_ID=...
```

## Branching

**`alpha` is this repo's default branch and the merge target for all
PRs** — not `master`. Always branch from `origin/alpha`:

```bash
git fetch origin alpha
git checkout -b my-branch-name origin/alpha
```

See CLAUDE.md's "Branching and environment promotion" section for the full
`alpha` → `beta` → `master` promotion model.
