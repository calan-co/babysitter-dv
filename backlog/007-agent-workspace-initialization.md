---
id: wi-007
title: Expose Babysitter-DV agent workspace initialization
type: work-item
subtype: story
lifecycle: active
status: completed
status_reason: completed
priority: high
completed_date: '2026-09-30'
links:
  depends_on:
    - '[[006-publisher-owned-work-result-contract-boundary]]'
  evidence:
    - '[[record-wi-007-agent-workspace-initialization-validation-and-review]]'
tags:
  - babysitter
  - doc-vader
  - agents
  - workspace
  - afk
---

## Goal

Expose Babysitter-DV to coding agents as reusable workspace instructions, skill, and initialization tooling so a repository can be initialized once and subsequent sessions follow the DV work-item and Babysitter-DV delivery policy.

## Tasks

- [x] Add project instructions that require DV work-item tracking, dedicated worktrees, Babysitter-DV usage for ready AFK work, and fail-closed behavior.
- [x] Add a project skill with the Babysitter-DV runbook.
- [x] Add an initializer command that can install the instructions and skill into another workspace without overwriting by default.
- [x] Add focused tests and run repository validation.

## Acceptance Criteria

- [x] A single command can preview and write the agent policy files for a target workspace.
- [x] Initialized workspaces tell agents to use `dv work ready --json`, one dedicated worktree per work item, and Babysitter-DV gates.
- [x] The initializer fails closed instead of overwriting existing policy files unless explicitly forced.
- [x] Focused tests and `npm run check` pass.

## Dependencies

[[006-publisher-owned-work-result-contract-boundary]]
