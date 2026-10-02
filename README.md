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

A publisher-owned selection capability decides whether a requested Work item is selected. Babysitter checks only the capability envelope, requested identity, and non-empty opaque command/result evidence; it does not execute or semantically validate publisher ready, show, validate, or close results. It snapshots accepted publisher transport as JSON before delivery, so inherited, non-enumerable, mutable-accessor, or non-serializable values fail closed rather than producing unreconstructable journal evidence.

Repositories may supply an **optional repository override** for command argv compatibility only when it declares `compatibleWith: ["doc-vader-contract/v1"]`. That declaration constrains argv construction (including JSON transport), not publisher Work-result schemas or semantics. It does not change policy, acceptance, or evidence controls.

## Agent workspace initialization

Initialize a repository once so future Pi sessions see the DV/Babysitter-DV policy automatically:

```sh
npm run workspace:init -- --dir /path/to/workspace --yes
```

Preview without writing:

```sh
npm run workspace:init -- --dir /path/to/workspace --dry-run --json
```

The initializer appends or updates a managed Babysitter-DV block in `AGENTS.md`, writes `.pi/skills/babysitter-dv/SKILL.md`, and injects the runtime under `.babysitter-dv/` so skill paths resolve inside the target workspace. It preserves existing `AGENTS.md` content and refuses to overwrite custom Babysitter-DV skill/runtime files unless `--force` is provided.

After initialization, interact through vanilla Babysitter:

```text
/babysitter:call resolve the next ready DV work item with Babysitter-DV
```

or from a shell:

```sh
genty call --harness <harness> --prompt "resolve the next ready DV work item with Babysitter-DV" --workspace /path/to/workspace
```
