---
id: wi-015
title: Normalize Doc-Vader publisher selection artifacts in default adapter
type: work-item
subtype: bug
lifecycle: active
status: completed
status_reason: completed
priority: high
completed_date: '2026-09-30'
links:
  depends_on:
    - '[[014-provide-built-in-dv-ports]]'
  evidence:
    - '[[record-wi-015-normalize-dv-selection-artifact-validation-and-review]]'
tags:
  - babysitter
  - doc-vader
  - adapter
  - publisher-selection
  - afk
---

## Goal

Fix the built-in default adapter so Doc-Vader's `dv work select` response shape satisfies Babysitter-DV's publisher selection boundary.

## Background

A target run halted at ready item `wi-008` with `Invalid publisher work selection: publisher decision command must be a non-empty opaque array`. Doc-Vader returned `decisionArtifact.invokedCommand/sourceResult`, while Babysitter-DV expects publisher evidence shaped as `decisionArtifact.command` plus `result` or `artifact`.

## Tasks

- [x] Normalize default `dv work select` responses that lack `decisionArtifact.command` into `{ command, result }` evidence.
- [x] Preserve already-normalized publisher decision artifacts.
- [x] Add focused regression coverage for Doc-Vader-shaped not-selected evidence.
- [x] Keep selected-path coverage for already-normalized evidence.
- [x] Run validation and independent review.

## Acceptance Criteria

- [x] Doc-Vader-shaped `decisionArtifact.invokedCommand/sourceResult` no longer fails the publisher evidence boundary.
- [x] A not-selected publisher response pauses with the expected non-selection reason, not an invalid command-artifact error.
- [x] Already-normalized `{ command, result }` artifacts still pass.
- [x] Focused tests and `npm run check` pass.

## Dependencies

[[014-provide-built-in-dv-ports]]
