# babysitter-dv workspace policy

For implementation work in this workspace:

- Track work in Doc-Vader (dv) work items. Prefer `dv work ready --json`; do not invent untracked tasks.
- Use one dedicated git worktree per work item before editing files.
- For ready AFK work, use babysitter-dv rather than ad-hoc delivery. Load the `babysitter-dv` skill for the runbook.
- Do not bypass publisher selection, evidence, review, closure, integration, or cleanup gates. If a gate fails closed, stop and report the blocker.
- Validate with the repository's pinned gates before claiming completion: `npm run check` and, for release readiness, `npm run pilot:rehearse` from a clean checkout.
