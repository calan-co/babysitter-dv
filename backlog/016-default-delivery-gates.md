---
id: wi-016
title: Continue default delivery through review closure and integration gates
type: work-item
subtype: bug
lifecycle: active
status: completed
status_reason: completed
priority: high
completed_date: '2026-10-02'
links:
  depends_on:
    - '[[015-normalize-dv-selection-artifact]]'
  evidence:
    - '[[record-wi-016-default-delivery-gates-validation-and-review]]'
tags:
  - babysitter
  - doc-vader
  - adapter
  - delivery
  - afk
---

## Goal

Make the built-in default delivery adapter continue past draft implementation and focused validation into the remaining delivery gates.

## Background

A real Dewey run reached `wi-008`, created a dedicated worktree, completed a draft implementation, and passed focused validation, then paused before independent review, commit/closure evidence, and integration. The default adapter should not require the first implementation task to do every gate in one shot.

## Tasks

- [x] After the implementation task returns, start a second Babysitter task dedicated to delivery gates.
- [x] Reuse the same item worktree for the delivery-gates task.
- [x] Require the delivery-gates task to return `delivered`; do not accept `delivered` directly from the implementation task.
- [x] Document system/global and workspace install dependencies, including Pi plugin and Doc-Vader `dv` availability.
- [x] Add focused regression coverage and run validation/review.

## Acceptance Criteria

- [x] A first task result of `delivered` followed by a gate task result of `paused` keeps the overall process paused.
- [x] The second task receives the first result as `previous` and uses the same worktree.
- [x] Install docs explain global packages, workspace Pi plugin install, blueprint install, and no required `ports.mjs`.
- [x] Focused tests and `npm run check` pass.

## Dependencies

[[015-normalize-dv-selection-artifact]]
