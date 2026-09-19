# babysitter-dv

A stack-neutral Babysitter blueprint for deterministic AFK repository delivery with publisher-owned work selection.

The implementation is planned in `backlog/`.

## Pilot gates

Use the pinned root commands:

```sh
npm ci
npm run test
npm run check
npm run pilot:rehearse
```

`pilot:rehearse` refuses a non-clean Git checkout, then runs the disposable-repository E2E fixture and emits a single `babysitter-pilot-rehearsal/v1` JSON evidence record containing the pinned checkout SHA, command, result, and TAP-output SHA-256.

## Publisher capability and command-argv compatibility

A publisher-owned selection capability decides whether a requested Work item is selected. Babysitter checks only the capability envelope, requested identity, and non-empty opaque command/result evidence; it does not execute or semantically validate publisher ready, show, validate, or close results.

Repositories may supply an **optional repository override** for command argv compatibility only when it declares `compatibleWith: ["doc-vader-contract/v1"]`. That declaration constrains argv construction (including JSON transport), not publisher Work-result schemas or semantics. It does not change policy, acceptance, or evidence controls.
