---
name: issue-create
description: Turn a raw chunk of text (a feature idea, bug description, plan draft) into a GitHub issue. Checks open issues for close overlap first — if an existing issue's scope would only need a small extension to cover the new text, rewrites that issue's body instead of creating a duplicate. Then runs issue-triage on whichever issue resulted, which (given an issue number) continues straight into its own plan-mode flow in this same session.
---

# Create (or extend) a GitHub issue from raw text

Invocation: `/issue-create <raw text>` (or run with no argument and paste/
describe the text in the next message) — the input is whatever the user
just wrote: a chunk of notes, a plan draft, a bug description, anything
describing something they want done.

**When to use this instead of a cold plan-mode session:** any time you're
about to enter plan mode in this repo for work that will likely lead to a
code change, go through `/issue-create` first rather than starting plan
mode directly — that's what gets the work tracked as a GitHub issue and
kept in sync as the plan iterates. Skip it for things that won't produce a
code change (answering a question, explaining existing behavior) — those
don't need an issue. If the user already invoked `/issue-triage <N>` for an
existing issue, don't run this — go straight to that skill's flow, no new
issue needed.

## Steps

1. **Read the input** and distill it into a clear, structured issue
   (title + body) — same shape as this repo's templates in
   `.github/ISSUE_TEMPLATE/` (`bug_report.md`'s what/repro/expected-behavior
   shape for bugs, `feature-idea.md`'s why/what user-story shape for
   features, or `new-task.md`'s story-points/how shape for plain dev tasks
   — whichever fits). Don't just paste the raw text verbatim as the body —
   clean it up into something scannable, but don't lose specifics the user
   gave (numbers, file names, exact behavior described).

2. **Check open issues for overlap**:
   ```
   gh issue list --state open --json number,title,body
   ```
   Read through them and ask: **would an existing issue's plan/scope, with
   only a small addition or slight extension, already cover this new
   text?** This is a narrow bar — not "same feature area" or "related," but
   genuinely "this is basically the same underlying thing, or a small
   addendum to it." A new-but-related feature idea, or a bug in a
   different code path that merely touches the same file, is NOT overlap —
   create a new issue for those.

3. **If no overlapping issue is found** — create a new one:
   ```
   gh issue create --title "..." --body-file -
   ```
   (pipe the distilled body in). Do not add labels here — that's step 5.

4. **If an overlapping issue IS found** — extend it rather than creating a
   duplicate:
   - Fetch its current body: `gh issue view <N> --json body`.
   - Rewrite the body to incorporate the new scope — merge the new text
     into the existing structure (e.g. add to "what you want," extend
     repro steps, add a new consideration) rather than concatenating the
     two bodies naively. Preserve everything from the original that's
     still accurate; don't drop prior specifics.
   - Update it: `gh issue edit <N> --body-file -`.
   - Post a short comment on the issue noting it was iterated and
     summarizing what changed/was added, e.g.:
     ```
     gh issue comment <N> --body "Iterated based on new input: <one-line summary of what was added/changed>."
     ```
   - Do not create a second issue for the same thing.

5. **Hand off to `/issue-triage <N>` for this one issue**, in this same
   session, where `<N>` is the issue number from step 3 or 4. Read and
   follow `.claude/skills/issue-triage/SKILL.md` directly, starting from
   its sweep steps (classify bug/idea + priority, post the
   feedback/plan comment with the `<!-- issue-triage:v1 -->` marker) and
   continuing straight into that same skill's "Plan-mode load" section
   (since an issue number is present) rather than stopping after the
   sweep. Don't duplicate that logic here or report back and stop — follow
   the other skill's file directly so the two can't drift apart.
