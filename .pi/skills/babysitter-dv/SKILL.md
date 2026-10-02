---
name: babysitter-dv
description: Use when implementing or validating Doc-Vader work items with the Babysitter-DV delivery blueprint. Applies to requests mentioning dv work items, AFK delivery, MVP blockers, dedicated worktrees, or babysitter-dv.
---

# Babysitter-DV

Use vanilla Babysitter after workspace initialization. The target-local runtime lives at `.babysitter-dv/blueprints/babysitter-afk-v6/process.mjs`; do not point at the original `babysitter-dv` source checkout.

Start runs the normal Babysitter way:

```text
/babysitter:call resolve the next ready DV work item with Babysitter-DV
```

or, from a shell:

```sh
genty call --harness <harness> --prompt "resolve the next ready DV work item with Babysitter-DV" --workspace .
```

Workflow policy for the Babysitter run:

1. Inspect work:
   - `dv work ready --json`
   - `dv work status <work-id> --json` when diagnosing a specific item.
2. Use one dedicated git worktree per work item. Do not edit the base checkout for item implementation.
3. For selected AFK-ready work, use the injected Babysitter-DV runtime at `.babysitter-dv/blueprints/babysitter-afk-v6/process.mjs`.
4. Fail closed. Do not bypass publisher-owned selection, evidence manifest verification, independent review, closure, integration, or cleanup gates.
5. If Babysitter-DV pauses or rejects a boundary, report the blocker and preserve recovery artifacts.
6. Validate before completion:
   - focused test for the changed behavior
   - `npm run check`
   - `npm run pilot:rehearse` for release/MVP readiness from a clean checkout
