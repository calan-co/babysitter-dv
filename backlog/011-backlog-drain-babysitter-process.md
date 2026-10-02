---
id: wi-011
title: Drain ready DV backlog work from one vanilla Babysitter call
type: work-item
subtype: story
lifecycle: active
status: completed
status_reason: completed
priority: high
completed_date: '2026-09-30'
links:
  depends_on:
    - '[[010-use-babysitter-native-extension-hooks]]'
  evidence:
    - '[[record-wi-011-backlog-drain-babysitter-process-validation-and-review]]'
tags:
  - babysitter
  - doc-vader
  - agents
  - workspace
  - afk
---

## Goal

Make the initialized Babysitter-DV process support the ideal interaction: a simple vanilla Babysitter call can systematically work through the entire backlog of unblocked DV work until the backlog is drained or a gate pauses.

## Background

The `.a5c` integration previously installed an item-oriented process that still expected a specific work item input. The target UX is a project-local Babysitter process that discovers `dv work ready --json` candidates itself and processes them one at a time with the existing fail-closed Babysitter-DV gates.

## Tasks

- [x] Change the generated project-local process to drain ready DV candidates when no `itemId` is provided.
- [x] Add a Babysitter-discoverable `.a5c/processes/babysitter-dv.js` wrapper for the project-local process.
- [x] Use native Babysitter halt semantics when a gate pauses or the ready set stalls.
- [x] Keep single-item execution available when `runInput.itemId` is provided.
- [x] Default to project-local `ports.mjs` and include a `ports.example.mjs` configuration stub.
- [x] Update vanilla Babysitter install docs and examples to omit per-item inputs for backlog drain mode.
- [x] Add focused tests and validation evidence.

## Acceptance Criteria

- [x] A generated process with an empty ready list returns a drained result without needing an item input.
- [x] A generated process uses `ctx.halt(...)` instead of completing the run when a delivery gate pauses.
- [x] The install docs describe `/babysitter:call` as a backlog-drain interaction.
- [x] The shell example can use `genty call --process ... --workspace ...` without per-item inputs.
- [x] Existing `AGENTS.md` remains untouched and custom `.a5c` files are not overwritten without `--force`.
- [x] Focused tests and `npm run check` pass.

## Dependencies

[[010-use-babysitter-native-extension-hooks]]
