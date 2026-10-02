---
id: wi-017
title: Document Babysitter-DV installation dependencies and workspace setup
type: work-item
subtype: documentation
lifecycle: active
status: completed
status_reason: completed
priority: medium
completed_date: '2026-10-02'
links:
  depends_on:
    - '[[016-default-delivery-gates]]'
  evidence:
    - '[[record-wi-017-installation-docs-validation-and-review]]'
tags:
  - docs
  - install
  - babysitter
  - pi
  - genty
---

## Goal

Capture complete installation instructions for Babysitter-DV and its system/workspace dependencies.

## Tasks

- [x] Add detailed installation documentation for global tools, workspace Pi plugin setup, Babysitter-DV blueprint install/update, verification, and running through Pi.
- [x] Link to dependency install docs for Node/npm, Babysitter, Genty, Babysitter Pi plugin, Pi, and pnpm/Doc-Vader context.
- [x] Update README and generated blueprint install instructions to point at the detailed docs and preserve no-`ports.mjs` guidance.
- [x] Validate docs/tests and independent review.

## Acceptance Criteria

- [x] Detailed install docs are committed under `docs/installation.md`.
- [x] README links to the detailed install docs.
- [x] Blueprint install instructions include dependency links and the full install process reference.
- [x] `npm run check` passes.

## Dependencies

[[016-default-delivery-gates]]
