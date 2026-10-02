---
id: wi-019
title: Spike PR CI merge closure and archival workflow boundaries
type: work-item
subtype: spike
lifecycle: active
status: ready
priority: high
links:
  depends_on:
    - '[[016-default-delivery-gates]]'
tags:
  - spike
  - github
  - pr
  - ci
  - merge
  - closure
  - archival
---

## Goal

Define the Babysitter-DV boundaries and workflow for PR creation, CI/code-review gates, merge, Doc-Vader closure, and archival so the default adapter can stop relying on prompt-only delivery gates.

## Questions

- Which system owns each state transition: Babysitter-DV, Babysitter, Doc-Vader, Git provider, or repository policy?
- What is the minimum durable evidence for PR creation, review approval, CI success, merge, DV closure, and archive/cleanup?
- Should Babysitter-DV create/push branches and PRs directly, or delegate that to an injected Git-provider port?
- How are required CI checks and code-review requirements discovered: repository config, provider branch protection, explicit install config, or Doc-Vader policy?
- What happens on draft PR, failed CI, requested changes, stale target branch, merge conflict, closed PR, or already-merged branch?
- When is it safe to close the DV work item: before merge, after PR approval, after merge, or after archival evidence?
- What archival means: keep worktree/branch/PR artifacts, remove local worktrees, delete branches, write DV record, or all of these?

## Proposed Investigation

- [ ] Map the current delivery flow from `createAfkDeliveryBlueprint`, `createReviewRemediationCoordinator`, and `createGitWorktreeTransaction`.
- [ ] Identify the smallest provider-port contract for branch push, PR create/update, review status, CI status, merge, and archival.
- [ ] Decide which checks are hard gates versus advisory evidence.
- [ ] Specify fail-closed recovery states for failed CI, requested changes, stale target, conflicts, merge failures, and post-effect evidence recording failures.
- [ ] Define how the default adapter should behave without GitHub/PR credentials.
- [ ] Produce implementation work items for the selected workflow.

## Acceptance Criteria

- [ ] A short design note or ADR documents the selected ownership boundaries and state machine.
- [ ] The design includes evidence artifacts required for each irreversible side effect.
- [ ] The design defines default behavior for GitHub-backed repositories and a provider-port seam for non-GitHub repositories.
- [ ] The design explicitly covers CI status polling, code review approval, merge, DV closure, and local/remote archival cleanup.
- [ ] Follow-up work items are created for implementation and tests.

## Non-Goals

- Implementing PR/CI/merge automation in this spike.
- Replacing Doc-Vader readiness/priority semantics.
- Building provider-specific abstractions beyond the minimum contract needed for the follow-up implementation.

## Dependencies

[[016-default-delivery-gates]]
