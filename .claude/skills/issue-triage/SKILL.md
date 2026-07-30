---
name: issue-triage
description: Triage GitHub issues on this repo — classify bug vs. idea (feature), apply a priority label, and post a feedback/implementation-sketch comment. With no issue number, sweeps all open issues (read/comment/label only, never enters plan mode). With an issue number, triages that issue if needed and then loads it into plan mode so the user can review/edit/approve an implementation plan before Claude writes code — syncing each plan draft back to the issue as it iterates, so the session can be paused and resumed later. On approval, creates a dedicated branch and implements.
---

# Issue triage (and, for a single issue, plan-mode load)

Invocation: `/issue-triage` (sweep all open issues, triage only — never
loads any issue locally) or `/issue-triage <N>` (triage issue `N` if
needed, then continue straight into a plan-mode session for it, in this
same session).

The no-argument sweep only runs read/comment/label actions against GitHub
issues via the `gh` CLI — it never edits repo files, creates branches,
commits, or opens PRs, and never enters plan mode. Passing an issue number
is a different, heavier mode: after ensuring that issue is triaged, it
continues on to load the issue into plan mode, and (on approval) implement
it — see "Plan-mode load" below.

## Sweep steps (no issue number given, or as the first phase when one is)

1. **List candidates.**
   ```
   gh issue list --state open --json number,title,body,labels
   ```
   If an issue number argument was given, restrict to that issue
   (`gh issue view <N> --json number,title,body,labels`).

2. **For each candidate, fetch the full thread** to decide what's needed:
   ```
   gh issue view <N> --comments
   ```
   Every comment this skill posts as triage ends with a trailing HTML
   marker, `<!-- issue-triage:v1 -->`, invisible when rendered (a separate
   `<!-- issue-plan:v1 -->` marker is used for the plan-mode draft comment
   — see "Plan-mode load" below; don't confuse the two). Use the triage
   marker to classify the issue's state:
   - **No comment on the issue contains the marker** → needs **initial
     triage**.
   - **The marker IS present, but the issue's most recent comment is from
     the human repo owner and was posted after the last marker-tagged
     comment** → needs a **revision** (the user replied to Claude's triage
     and it should be re-addressed).
   - **The marker-tagged comment is already the most recent comment** →
     **skip**, nothing new since last triage.

3. **For every issue needing initial triage or revision:**
   - Read the issue title/body and (for revisions) the full thread,
     including what the user said in their reply.
   - Classify as `bug` or `idea` — reuse these existing labels (this repo
     uses `idea` for feature requests, not `enhancement`), don't invent new
     category labels. Also pick exactly one of `priority-high` /
     `priority-medium` / `priority-low` based on how urgent/impactful the
     issue reads (a broken core borrow/return/reservation flow is high; a
     nice-to-have UI tweak is low). This is the only point in the whole
     pipeline where these labels get set — plan-mode iteration later never
     re-prioritizes.
     ```
     gh issue edit <N> --add-label "bug"        # or "idea"
     gh issue edit <N> --add-label "priority-medium"   # or high/low
     ```
     If a stale priority/type label from a prior pass is present and no
     longer correct, remove it first (`gh issue edit <N> --remove-label
     "..."`).
   - Read this repo's root `CLAUDE.md` to ground the comment in real file
     paths and known constraints — particularly the testing policy (any
     backend/frontend behavior change needs a corresponding test) and the
     Gen 1 vs. Gen 2 Amplify migration state (`amplify/` is still the live
     source of truth until migration Phase 6 completes; don't sketch new
     work against `amplify-gen2/` as if it were deployed).
   - Post **one** comment via `gh issue comment <N> --body-file -` (pipe
     the body in; don't rely on shell-escaping a `--body` string)
     containing:
     1. A one-paragraph restatement of the ask, as a sanity check — call
        out if it's vague, already done, or conflicts with CLAUDE.md.
     2. A short implementation sketch: which files/layers are likely
        involved, citing real paths (e.g. "this would live in
        `ts-code/src/api/BorrowItem.ts` plus a new test in
        `ts-code/__tests__/unit/api/BorrowItem.test.ts` per the testing
        policy in root CLAUDE.md").
     3. If this is a **revision**, an explicit paragraph responding to
        what the user said changed — don't just restate the original plan.
     4. A closing line stating no code has been changed yet — for a sweep
        (no issue number), note a human can run `/issue-triage <N>` later
        to load it into plan mode; skip this line if this triage pass was
        itself invoked as phase one of a single-issue `/issue-triage <N>`
        call (phase two picks up immediately below instead).
     5. The trailing marker `<!-- issue-triage:v1 -->` on its own line.

4. **Never** (during the sweep, or during phase one of a single-issue
   call): create branches, commits, or PRs; edit any repo file; run the
   app. Only `gh issue list/view/edit/comment`.

5. **If no issue number was given, stop here** and print a short summary
   table: issue number, title, action taken (labeled + commented / revised
   / skipped). Do not proceed to plan-mode load for anything.

## Plan-mode load (only when an issue number `<N>` was given)

Runs after the sweep steps above have ensured issue `<N>` is triaged (skip
re-running the sweep if `/issue-create` already triaged this exact issue
earlier in this same session — reuse that result).

6. **Briefly summarize** the issue and triage state back to the user (a
   couple of sentences: what the issue asks for, what triage said, whether
   there's been back-and-forth since, and whether a plan draft already
   exists from a prior session).

7. **Enter plan mode**, using the same phased flow as any other plan-mode
   session (Explore → Plan → Review → Final Plan → ExitPlanMode) — seed
   Phase 1 (Initial Understanding) with (in priority order) the existing
   `<!-- issue-plan:v1 -->` draft comment if one exists, otherwise the
   issue body + triage comment's implementation sketch, refined against
   anything the user said in later replies (a later human reply posted
   after the most recent of the triage/plan comments should be treated as
   an amendment or correction, not ignored). The plan MUST account for this
   repo's standing testing policy (root `CLAUDE.md`) — any backend or
   frontend behavior change needs a corresponding test change as part of
   the same plan, not a follow-up. Use AskUserQuestion as normal for any
   ambiguity, and write the plan to the plan file as usual.

   **7a. Sync the draft back to the issue at each phase boundary** — right
   after presenting Review, and again right after writing the Final Plan
   (not on every intermediate message, just these checkpoints, so the user
   can pause here and resume in a fresh session later via `/issue-triage
   <N>` without losing the draft):
   - Update the issue body (`gh issue edit <N> --body-file -`) if the core
     ask has changed enough that the original body would mislead a reader,
     merging rather than clobbering.
   - Find whether a comment containing `<!-- issue-plan:v1 -->` already
     exists on the issue (from step 2's `--comments` fetch, or re-fetch if
     this is a later sync in the same session):
     - **If not present**, post one: `gh issue comment <N> --body-file -`
       with the current plan draft, ending in the `<!-- issue-plan:v1 -->`
       marker on its own line.
     - **If present**, edit that same comment in place rather than posting
       a new one — `gh api -X PATCH repos/{owner}/{repo}/issues/comments/
       <comment-id> -f body=@-` (get `<comment-id>` from the `--comments
       --json` form of step 2's view call), replacing its body with the
       current draft plus the same trailing marker. The issue should only
       ever carry one `<!-- issue-plan:v1 -->` comment at a time — it's a
       rolling "current draft," not a history log. Leave the separate
       `<!-- issue-triage:v1 -->` comment untouched — it's a different
       marker with its own lifecycle owned by the sweep steps above.

8. **On approval** (after `ExitPlanMode` returns control), before writing
   any code:
   - Determine the GitHub username: `gh api user --jq .login`.
   - Determine the next version number for this issue's branch by checking
     both local and remote branches:
     ```
     git branch --list "GH-<N>/<username>/v*"
     git ls-remote --heads origin "GH-<N>/<username>/v*"
     ```
     Take the highest `v<n>` found across both and increment it; if none
     exist, use `v1`.
   - If a branch matching this pattern already exists (e.g. from a prior
     partial attempt), **ask the user** whether to resume that branch or
     create a new `vN` — don't silently pick one.
   - **Always branch from `origin/master`, never from whatever branch
     happens to be checked out** — this repo's default branch is `master`,
     not `main`. A prior session may have left an unrelated issue's branch
     active, and branching from that silently drags its commits into the
     new branch's history. Run `git fetch origin master` first, then
     create and switch to the new branch from the fetched ref:
     `git checkout -b GH-<N>/<username>/v<n> origin/master`.

9. **Implement per the approved plan**, following this repo's existing
   conventions — most importantly the standing testing policy in root
   `CLAUDE.md`: any change to `ts-code/src/db/*.ts`, `src/api/*.ts`, or
   `src/handlers/**/*.ts` needs a matching test under
   `ts-code/__tests__/unit/`, and any new frontend flow (once `web/`
   exists) needs Jest/RTL and/or Playwright coverage. Run `npm run build`
   then `npm run test:unit` before considering the implementation done —
   a change without a passing, updated test is not complete, per CLAUDE.md.
   Every commit made on this branch must include a trailing line
   `Refs #<N>` — deliberately the non-closing form (not
   `Fixes`/`Closes`/`Resolves`), so merging this branch does **not**
   auto-close the issue; the user closes it manually after testing.

10. **Pushing/merging**: `.github/workflows/backend-ci.yml` runs build +
    unit tests + an 80% coverage gate on every PR to `master` — open a PR
    with `gh pr create` and wait for that check to go green before merging,
    rather than pushing directly to `master`. Ask before pushing/merging,
    same as normal.
