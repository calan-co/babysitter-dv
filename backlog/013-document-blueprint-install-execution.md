---
id: wi-013
title: Document blueprint install process execution
type: work-item
subtype: bug
lifecycle: active
status: completed
status_reason: completed
priority: high
completed_date: '2026-09-30'
links:
  depends_on:
    - '[[012-use-babysitter-blueprint-install-packaging]]'
  evidence:
    - '[[record-wi-013-document-blueprint-install-execution-validation-and-review]]'
tags:
  - babysitter
  - doc-vader
  - marketplace
  - workspace
  - afk
---

## Goal

Clarify the Babysitter-DV blueprint install flow so users know `babysitter blueprints:install` returns instructions and a `processFile`, but does not itself write the project `.a5c` files.

## Background

A user ran `babysitter blueprints:install` and saw only `install.md` output. Babysitter's blueprint install command returns the package instructions and process path for the agent/operator to execute. The Babysitter-DV install docs must make the second step explicit.

## Tasks

- [x] Update `install.md` to state that `blueprints:install` is non-mutating and returns `processFile`.
- [x] Add an executable `babysitter run:create` / `run:iterate` example for the returned process file.
- [x] Update README to explain the two-step packaged install flow.
- [x] Add focused coverage for the install docs.

## Acceptance Criteria

- [x] The installed blueprint docs mention `processFile`, `run:create`, and `run:iterate`.
- [x] README does not imply `blueprints:install` directly writes workspace files.
- [x] Focused tests and `npm run check` pass.

## Dependencies

[[012-use-babysitter-blueprint-install-packaging]]
