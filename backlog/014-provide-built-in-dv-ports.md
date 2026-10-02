---
id: wi-014
title: Provide built-in Doc-Vader adapter ports
type: work-item
subtype: bug
lifecycle: active
status: completed
status_reason: completed
priority: high
completed_date: '2026-09-30'
links:
  depends_on:
    - '[[013-document-blueprint-install-execution]]'
  evidence:
    - '[[record-wi-014-provide-built-in-dv-ports-validation-and-review]]'
tags:
  - babysitter
  - doc-vader
  - adapter
  - workspace
  - afk
---

## Goal

Remove mandatory user-authored `ports.mjs` from the installed Babysitter-DV flow. Babysitter-DV is the adapter between Babysitter and Doc-Vader, so the default install must provide well-defined DV/Babysitter ports.

## Background

The generated process previously required target users to copy and implement `ports.example.mjs`. That made the adapter incomplete from the user's perspective and defeated the purpose of a Babysitter-DV bridge.

## Tasks

- [x] Provide default publisher selection through `dv work select`.
- [x] Provide default evidence journal/state/worktree/delivery adapter seams in the generated process.
- [x] Keep `configModule` only as an optional advanced override.
- [x] Remove generated `ports.example.mjs` and required-ports documentation.
- [x] Add focused tests and validation evidence.

## Acceptance Criteria

- [x] `workspace:init` no longer installs `ports.example.mjs`.
- [x] The generated process can reach a DV selection gate without any user-authored ports module.
- [x] Documentation states no `ports.mjs` is required for the default adapter.
- [x] Optional `configModule` remains available for advanced overrides.
- [x] Focused tests and `npm run check` pass.

## Dependencies

[[013-document-blueprint-install-execution]]
