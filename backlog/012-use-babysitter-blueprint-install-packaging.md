---
id: wi-012
title: Use Babysitter blueprint install packaging for workspace initialization
type: work-item
subtype: story
lifecycle: active
status: completed
status_reason: completed
priority: high
completed_date: '2026-09-30'
links:
  depends_on:
    - '[[011-backlog-drain-babysitter-process]]'
  evidence:
    - '[[record-wi-012-use-babysitter-blueprint-install-packaging-validation-and-review]]'
tags:
  - babysitter
  - doc-vader
  - marketplace
  - workspace
  - afk
---

## Goal

Expose Babysitter-DV initialization through Babysitter's blueprint marketplace/install packaging instead of only a custom direct installer.

## Background

Babysitter provides blueprint marketplace commands and package conventions (`marketplace.json`, `install.md`, `configure.md`, and optional `install-process.js`). `workspace:init` should be a compatibility wrapper around that install process, not the only installation path.

## Tasks

- [x] Add a repository marketplace manifest for the Babysitter-DV blueprint.
- [x] Add blueprint `install.md`, `configure.md`, and `install-process.js` packaging.
- [x] Make `workspace:init` invoke the blueprint install process.
- [x] Keep generated `.a5c/processes` backlog-drain behavior unchanged.
- [x] Update documentation and focused tests.

## Acceptance Criteria

- [x] The repository exposes `babysitter-dv` in `marketplace.json` with `packagePath: blueprints/babysitter-dv`.
- [x] The blueprint package includes install/configure docs and an importable install process.
- [x] `npm run workspace:init` uses the same install process and preserves previous safety behavior.
- [x] Focused tests and `npm run check` pass.

## Dependencies

[[011-backlog-drain-babysitter-process]]
