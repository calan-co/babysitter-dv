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

## Installation

Detailed system and workspace setup lives in [`docs/installation.md`](docs/installation.md).

Dependency install docs:

- [Node.js / npm](https://nodejs.org/en/download)
- [Babysitter](https://github.com/a5c-ai/babysitter/tree/main/packages/babysitter#readme)
- [Genty](https://github.com/a5c-ai/babysitter/tree/main/packages/genty/cli#readme)
- [Babysitter Pi plugin](https://github.com/a5c-ai/babysitter-pi#readme)
- [Pi](https://pi.dev/) / [Pi coding-agent package](https://github.com/earendil-works/pi/tree/main/packages/coding-agent)
- [pnpm](https://pnpm.io/installation) for local/internal Doc-Vader installs

Shortest workspace install:

```sh
cd /path/to/workspace
npm install -g @a5c-ai/babysitter-sdk @a5c-ai/genty @a5c-ai/babysitter-pi
babysitter harness:install-plugin pi --workspace "$PWD" --json
babysitter blueprints:add-marketplace --marketplace-url https://github.com/calan-co/babysitter-dv.git --project --json
```

Then apply the returned Babysitter-DV install process as shown in [`docs/installation.md`](docs/installation.md). `blueprints:install` returns a `processFile`; it does not write workspace files until that install process is run.

For local development, the compatibility wrapper invokes the same blueprint `install-process.js` directly:

```sh
npm run workspace:init -- --dir /path/to/workspace --yes --force
```

The initializer installs Babysitter-native project files under `.a5c/`, leaves existing `AGENTS.md` and harness-specific skill files alone, and refuses to overwrite custom Babysitter-DV `.a5c/` files unless `--force` is provided.

After initialization, run from a Pi session:

```text
/babysitter:call systematically work through the ready DV backlog using the project Babysitter-DV process
```

No `ports.mjs` is required for the default DV adapter.
