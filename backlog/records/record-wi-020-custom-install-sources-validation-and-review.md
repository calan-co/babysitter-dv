---
$schema: schemas/work-management/frontmatter/record.json
id: record-wi-020-custom-install-sources-validation-and-review
title: wi-020 custom install source support validation and review approved
summary: wi-020 added custom dependency package specs to the install script and docs
type: record
subtype: test-result
lifecycle: active
status: ready
status_reason: recorded
links:
  supporting_reference:
    - 'command:node --test test/agent-workspace-init.test.mjs'
    - 'command:npm run check'
    - 'command:git diff --check'
---

## Recorded At

2026-10-02T00:00:00Z

## Outcome

passed

## Observation

Focused initializer tests passed 6 tests, including script help assertions for custom source flags and the local Babysitter Pi plugin example. Full repository validation passed 136 tests with 0 failures, Doc-Vader backlog validation exited 0, and `git diff --check` passed.

Independent review returned APPROVED with no blockers. It verified custom specs are supported for Babysitter, Genty, Babysitter Pi plugin, optional Pi CLI, and Doc-Vader; the `~/dev/upstream/a5c-ai/babysitter-pi` example appears in script help, `docs/installation.md`, and blueprint install docs; and shell/doc/test checks pass.

## Subject References

- wi-020
- scripts/install-babysitter-dv.sh
- docs/installation.md
- blueprints/babysitter-dv/install.md

## Findings

- Independent reviewer verdict: approved
- Focused suite: 6 passed, 0 failed
- Full suite: 136 passed, 0 failed
- Backlog validation: passed, exit_code=0

## Supporting References

- command:node --test test/agent-workspace-init.test.mjs
- command:npm run check
- command:git diff --check
