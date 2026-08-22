# ADR-001: Publisher-owned Work-result contract boundary

- **Status:** Accepted
- **Date:** 2026-08-21
- **Deciders:** Babysitter-DV maintainers
- **Related work item:** [[../../../../backlog/006-publisher-owned-work-result-contract-boundary.md]]
- **External dependency:** Doc-Vader POC defect `ttr-dec7d9a9-b46f-45e8-8af5-65a9792b820a`

## Context

Babysitter-DV currently decodes an obsolete, locally duplicated Doc-Vader readiness shape (`v1` with `workItems`) in `src/doc-vader-contract.mjs`. The current Doc-Vader publisher emits `task-ready/v1` with `candidates`; a valid fixture containing `wi-001` is rejected before any guarded effect.

The duplicate decoder couples Babysitter-DV to publisher-owned schemas and semantic rules. It cannot remain correct as Doc-Vader evolves its result representation.

## Decision

Doc-Vader (or another publishing/consuming system selected by the repository) owns Work-result schemas, versioning, and semantic validation. Babysitter-DV will not copy, validate, normalize, or infer Work-result schemas or readiness semantics.

Babysitter-DV retains a fail-closed consumer boundary:

- It performs no guarded effect until the configured publisher/consumer port reports an explicit, selected work identity that the port considers executable.
- Missing, malformed-at-the-transport-boundary, ambiguous, unsuccessful, or unselected port results stop the run before a worktree, command, state transition, review, or delivery side effect.
- It records the publisher/consumer command and opaque result evidence needed to reconstruct why an item was or was not selected.
- It does not reinterpret a publisher result to manufacture readiness, status, dependency, AFK, HITL, or priority decisions.

The boundary is therefore fail-closed on the existence of an authorized selection, not on Babysitter-DV reimplementation of publisher semantics.

## Migration and compatibility

1. Replace the duplicated `v1`/`workItems` decoder and `selectReadyWork` semantic path with an injected publisher-owned selection port.
2. Keep command-argv compatibility (`doc-vader-contract/v1`) separate from Work-result compatibility; it authorizes only how Babysitter-DV invokes Doc-Vader, not a copied result schema.
3. Add a contract fixture using the real `task-ready/v1`/`candidates` result and prove it reaches the port without Babysitter-DV schema decoding.
4. Preserve the existing evidence, readiness-before-worktree, and failure-before-side-effect guarantees.
5. Coordinate interface shape and acceptance evidence with the Doc-Vader POC defect before implementation. Do not add Agent Workflows as a dependency or participant.

## Supersession

This ADR supersedes the completed WI-001 documentation claims that Babysitter-DV accepts fixed Work-result schemas and semantically parses publisher results. Those historical claims describe the retired boundary and must not be used as implementation or compatibility guidance.

## Consequences

- Babysitter-DV has a smaller, more stable module boundary and cannot independently detect publisher semantic regressions.
- The publishing/consuming system must expose an explicit fail-closed selection result and own its schema migration policy.
- Existing callers using only the obsolete decoder must migrate to the injected selection port; no compatibility parser is retained in Babysitter-DV.
