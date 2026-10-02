---
id: wi-009
title: Inject Babysitter-DV runtime files for initialized skills
type: work-item
subtype: bug
lifecycle: active
status: completed
status_reason: completed
priority: high
completed_date: '2026-09-30'
links:
  depends_on:
    - '[[008-preserve-existing-agent-instructions]]'
  evidence:
    - '[[record-wi-009-inject-runtime-for-initialized-skill-validation-and-review]]'
tags:
  - babysitter
  - doc-vader
  - agents
  - workspace
  - afk
---

## Goal

Make initialized target workspaces self-contained enough for the installed Babysitter-DV skill paths to resolve inside the target workspace.

## Background

The installed skill referenced `blueprints/babysitter-afk-v6/process.mjs`, which only exists in the `babysitter-dv` source checkout. A target repository initialized with `workspace:init` received instructions that pointed at missing files.

## Tasks

- [x] Inject the Babysitter-DV runtime files needed by the skill into the target workspace.
- [x] Change the installed skill to reference the injected runtime path and start through vanilla Babysitter interaction.
- [x] Preserve existing target files and fail closed on runtime collisions unless `--force` is explicit.
- [x] Add focused coverage that the injected process imports successfully.
- [x] Update documentation and run validation.

## Acceptance Criteria

- [x] `workspace:init` installs `.babysitter-dv/blueprints/babysitter-afk-v6/process.mjs` and required runtime source files.
- [x] The installed skill references `.babysitter-dv/...` paths that exist in the target workspace and instructs users to start with `/babysitter:call` or `genty call` instead of low-level `babysitter run:create`.
- [x] The injected process module imports successfully from the target workspace.
- [x] Existing custom runtime files are not overwritten without `--force`.
- [x] Focused tests and `npm run check` pass.

## Dependencies

[[008-preserve-existing-agent-instructions]]
