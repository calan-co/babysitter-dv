---
id: wi-008
title: Preserve existing agent instructions during workspace initialization
type: work-item
subtype: bug
lifecycle: active
status: completed
status_reason: completed
priority: high
completed_date: '2026-09-30'
links:
  depends_on:
    - '[[007-agent-workspace-initialization]]'
  evidence:
    - '[[record-wi-008-preserve-existing-agent-instructions-validation-and-review]]'
tags:
  - babysitter
  - doc-vader
  - agents
  - workspace
  - afk
---

## Goal

Fix `workspace:init` so it can initialize realistic workspaces that already have `AGENTS.md` without requiring destructive `--force`.

## Background

The first initializer refused to run when `AGENTS.md` existed. Most target repositories already carry agent instructions, so refusing to initialize prevents the one-time setup flow from working.

## Tasks

- [x] Append or update a managed Babysitter-DV policy block in existing `AGENTS.md` while preserving existing content.
- [x] Keep custom `.pi/skills/babysitter-dv/SKILL.md` overwrite protected unless `--force` is explicit.
- [x] Make repeated initialization idempotent.
- [x] Update focused tests and validation evidence.

## Acceptance Criteria

- [x] Existing `AGENTS.md` content is preserved and gains a single Babysitter-DV managed block.
- [x] Re-running the initializer updates instead of duplicating the managed block.
- [x] Custom Babysitter-DV skill files still fail closed unless `--force` is provided.
- [x] Focused tests and `npm run check` pass.

## Dependencies

[[007-agent-workspace-initialization]]
