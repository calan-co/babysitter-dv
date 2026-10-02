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

Initialize a repository once so future Babysitter sessions can use the project-local Babysitter-DV process:

```sh
npm run workspace:init -- --dir /path/to/workspace --yes
```

Preview without writing:

```sh
npm run workspace:init -- --dir /path/to/workspace --dry-run --json
```

The initializer installs Babysitter-native project files under `.a5c/`:

- `.a5c/processes/babysitter-dv/process.mjs`
- `.a5c/processes/babysitter-dv/src/...`
- `.a5c/processes/babysitter-dv/inputs.example.json`
- `.a5c/blueprints/babysitter-dv/install.md`
- `.a5c/blueprints/babysitter-dv/configure.md`

It leaves existing `AGENTS.md` and harness-specific skill files alone, and refuses to overwrite custom Babysitter-DV `.a5c/` files unless `--force` is provided.

After initialization, interact through vanilla Babysitter. With repository-specific ports configured, one call can drain ready DV backlog work until no unblocked candidates remain or a gate pauses:

```text
/babysitter:call systematically work through the ready DV backlog using the project Babysitter-DV process
```

or from a shell:

```sh
genty call --harness <harness> --process .a5c/processes/babysitter-dv.js#process --workspace /path/to/workspace
```
