---
name: issue-list
description: List open GitHub issues on this repo, or show one issue's details by number. Read-only, no comments fetched — a quick way to see what's tracked without the full triage/plan thread.
---

# List or view GitHub issues

Invocation: `/issue-list` (list all open issues) or `/issue-list <N>` (show
issue `N`'s details).

Purely read-only — this skill never labels, comments, edits, or enters
plan mode. For triaging or loading an issue into plan mode, use
`/issue-triage [N]` instead.

## Steps

1. **No issue number given** — list open issues:
   ```
   gh issue list --state open --json number,title,labels,updatedAt
   ```
   Render as a compact table: number, title, labels, last-updated. If
   empty, say so plainly ("no open issues").

2. **Issue number given** — show that issue's body only, no comment thread:
   ```
   gh issue view <N> --json number,title,body,labels,state,url
   ```
   Print title, state, labels, and the body. Do not fetch or print
   comments (`--comments`) — that's what `/issue-triage <N>` is for, since
   the comment thread is where triage/plan history lives.
