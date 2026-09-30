---
name: babysitter-dv
description: Use when implementing or validating Doc-Vader work items with the Babysitter-DV delivery blueprint. Applies to requests mentioning dv work items, AFK delivery, MVP blockers, dedicated worktrees, or babysitter-dv.
---

# Babysitter-DV

Use this workflow for implementation work in an initialized workspace.

1. Inspect work:
   - `dv work ready --json`
   - `dv work status <work-id> --json` when diagnosing a specific item.
2. Use one dedicated git worktree per work item. Do not edit the base checkout for item implementation.
3. Run the Babysitter-DV blueprint for selected AFK-ready work. The v6 process lives at `blueprints/babysitter-afk-v6/process.mjs`.
4. Fail closed. Do not bypass publisher-owned selection, evidence manifest verification, independent review, closure, integration, or cleanup gates.
5. If Babysitter-DV pauses or rejects a boundary, report the blocker and preserve recovery artifacts.
6. Validate before completion:
   - focused test for the changed behavior
   - `npm run check`
   - `npm run pilot:rehearse` for release/MVP readiness from a clean checkout

Minimal command reminder:

```sh
cd blueprints/babysitter-afk-v6
npm ci
babysitter run:create --process-id babysitter-afk-doc-vader --entry "$PWD/process.mjs#process" --inputs ./inputs.json --non-interactive --json
```

Then continue with:

```sh
babysitter run:iterate <run-directory> --json
babysitter run:events <run-directory> --json
```
