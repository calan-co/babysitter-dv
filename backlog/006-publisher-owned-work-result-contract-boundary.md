---
id: wi-006
title: Adopt publisher-owned Work-result contract boundary
type: work-item
subtype: story
lifecycle: active
status: completed
status_reason: completed
priority: high
completed_date: '2026-09-29'
links:
  depends_on:
    - '[[005-babysitter-blueprint-evidence-and-e2e]]'
  reference:
    - '[[../docs/architecture/decisions/adr-001-publisher-owned-work-result-contract]]'
  evidence:
    - '[[record-wi-006-publisher-selection-validation-and-independent-review]]'
tags:
  - babysitter
  - doc-vader
  - contract
  - compatibility
  - governance
---

## Goal

Implement the publisher-owned Work-result boundary defined by ADR-001, so Babysitter-DV consumes an explicit publisher/consumer selection without duplicating Doc-Vader schemas or semantic validation.

## Background

A real valid Doc-Vader readiness fixture uses `task-ready/v1` and `candidates` (`wi-001`), while Babysitter-DV currently decodes obsolete `v1`/`workItems` output locally and rejects it before guarded effects. The user decision is that Doc-Vader or the selected publishing/consuming system owns Work-result contracts; Babysitter-DV retains only a fail-closed consumer boundary.

This work item and ADR-001 explicitly supersede WI-001's historical claims that Babysitter-DV accepts fixed Work-result schemas and semantically parses publisher output. WI-001 remains completion evidence for its original delivery, not current contract guidance.

## Coordination

- Coordinate the publisher-owned selection interface and acceptance evidence with Doc-Vader POC defect `ttr-dec7d9a9-b46f-45e8-8af5-65a9792b820a`.
- Do not involve Agent Workflows.
- Keep `doc-vader-contract/v1` command-argv compatibility distinct from Work-result schema authority.

## Tasks

- [x] Add a publisher-owned, injected selection port that returns an explicit selected work identity or a fail-closed outcome.
- [x] Remove Babysitter-DV's duplicated Work-result schema decoder and readiness semantic validation path.
- [x] Ensure missing, ambiguous, unsuccessful, or unselected port outcomes prevent every guarded side effect.
- [x] Preserve opaque publisher command/result evidence in the manifest and journal.
- [x] Add focused regression coverage using the real `task-ready/v1`/`candidates` fixture and negative fail-closed cases.
- [x] Update the blueprint contract documentation and compatibility guidance.
- [x] Run focused tests, full repository validation, and an independent review after implementation.

## Deliverables

- Publisher-owned Work-result selection port and fail-closed boundary.
- Removed duplicated readiness schema/semantic contract from Babysitter-DV.
- Focused real-fixture and negative-path tests.
- Updated compatibility documentation and linked ADR.

## Acceptance Criteria

- [x] A valid publisher result using `task-ready/v1`/`candidates` can select `wi-001` without Babysitter-DV decoding that schema.
- [x] Babysitter-DV does not contain a copied Doc-Vader Work-result schema or semantic validator.
- [x] No guarded effect occurs without an explicit, publisher/consumer-authorized selected work identity.
- [x] Missing, ambiguous, unsuccessful, or unselected outcomes fail closed before a worktree or other delivery side effect.
- [x] Command argv compatibility and Work-result authority remain independently documented and tested.
- [x] Focused tests, `npm run check`, and independent review pass.

## Dependencies

[[005-babysitter-blueprint-evidence-and-e2e]]
