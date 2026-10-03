---
id: wi-020
title: Support custom dependency sources in install script
type: work-item
subtype: enhancement
lifecycle: active
status: completed
status_reason: completed
priority: medium
completed_date: '2026-10-02'
links:
  depends_on:
    - '[[018-install-script]]'
  evidence:
    - '[[record-wi-020-custom-install-sources-validation-and-review]]'
tags:
  - install
  - script
  - docs
  - dependencies
---

## Goal

Let the Babysitter-DV installer use custom package specs or local source paths for its dependencies.

## Tasks

- [x] Add installer options for Babysitter CLI, Genty, Babysitter Pi plugin, optional Pi CLI, and Doc-Vader sources.
- [x] Keep published package defaults for the normal path.
- [x] Print an example using `~/dev/upstream/a5c-ai/babysitter-pi` instead of the published Pi plugin.
- [x] Document the custom-source example in installation docs and blueprint install docs.
- [x] Validate script help, shell syntax, docs tests, and full check.

## Acceptance Criteria

- [x] `scripts/install-babysitter-dv.sh --help` lists custom source options.
- [x] Help/docs include an example using `--babysitter-pi-source ~/dev/upstream/a5c-ai/babysitter-pi`.
- [x] Focused tests and `npm run check` pass.
- [x] Independent review approves the change.

## Dependencies

[[018-install-script]]
