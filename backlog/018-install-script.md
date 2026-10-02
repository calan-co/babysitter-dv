---
id: wi-018
title: Add install automation script and script-method documentation
type: work-item
subtype: enhancement
lifecycle: active
status: completed
status_reason: completed
priority: medium
completed_date: '2026-10-02'
links:
  depends_on:
    - '[[017-document-installation-dependencies]]'
  evidence:
    - '[[record-wi-018-install-script-validation-and-review]]'
tags:
  - install
  - docs
  - automation
  - babysitter
---

## Goal

Add a shell script that automates Babysitter-DV installation and document it as the primary script method.

## Tasks

- [x] Add `scripts/install-babysitter-dv.sh` with usage/help.
- [x] Support direct GitHub `curl | sh -s -- ...` usage.
- [x] Automate global tool install, optional Doc-Vader install, workspace Pi plugin install, marketplace add/update, blueprint install process application, stale `ports.mjs` cleanup, and verification.
- [x] Move existing step-by-step install docs under a Manual method section.
- [x] Add focused regression coverage for script and docs basics.
- [x] File upstream Babysitter issue for simplifying marketplace blueprint install/apply UX.

## Acceptance Criteria

- [x] The installer script passes `sh -n` and exposes `--help` usage.
- [x] `docs/installation.md` has Script method and Manual method sections.
- [x] Blueprint install docs mention the script method.
- [x] Focused tests and `npm run check` pass.
- [x] Upstream Babysitter install UX issue is filed.

## Dependencies

[[017-document-installation-dependencies]]
