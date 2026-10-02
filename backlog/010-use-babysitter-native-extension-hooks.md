---
id: wi-010
title: Use Babysitter-native extension hooks for workspace initialization
type: work-item
subtype: story
lifecycle: active
status: completed
status_reason: completed
priority: high
completed_date: '2026-09-30'
links:
  depends_on:
    - '[[009-inject-runtime-for-initialized-skill]]'
  evidence:
    - '[[record-wi-010-use-babysitter-native-extension-hooks-validation-and-review]]'
tags:
  - babysitter
  - doc-vader
  - agents
  - workspace
  - afk
---

## Goal

Move `workspace:init` from Pi-specific `AGENTS.md`/`.pi/skills` integration to Babysitter-native project-local extension hooks so post-install interaction uses the vanilla Babysitter surface.

## Background

Babysitter supports project-local `.a5c/processes/`, `.a5c/blueprints/`, `.a5c/skills/`, and `.a5c/agents/` lookup. The initializer should leverage those hooks instead of requiring users to invoke a Babysitter-DV-specific Pi skill or altering existing agent instructions.

## Tasks

- [x] Install the Babysitter-DV process under `.a5c/processes/babysitter-dv/`.
- [x] Install blueprint install/configure documentation under `.a5c/blueprints/babysitter-dv/`.
- [x] Stop writing Pi-specific `.pi/skills/babysitter-dv` and stop mutating `AGENTS.md`.
- [x] Document vanilla Babysitter usage with `/babysitter:call` and `genty call --process`.
- [x] Add focused tests and validation evidence.

## Acceptance Criteria

- [x] `workspace:init` writes project-local `.a5c/processes/babysitter-dv/process.mjs` and required runtime files.
- [x] The injected process imports successfully from a target workspace.
- [x] Existing `AGENTS.md` is left untouched.
- [x] The install docs use vanilla Babysitter interaction and no Pi-specific skill path.
- [x] Custom `.a5c` Babysitter-DV files are not overwritten without `--force`.
- [x] Focused tests and `npm run check` pass.

## Dependencies

[[009-inject-runtime-for-initialized-skill]]
