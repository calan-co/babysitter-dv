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

## Install dependencies

System/global install:

```sh
npm install -g @a5c-ai/babysitter-sdk @a5c-ai/genty @a5c-ai/babysitter-pi
# Doc-Vader is the `dv` CLI. Install it from your Doc-Vader package/source, for example:
# pnpm install -g /path/to/doc-vader
command -v babysitter genty pi dv
```

Workspace Pi plugin install:

```sh
babysitter harness:install-plugin pi --workspace /path/to/workspace --json
```

That writes the Pi Babysitter plugin under `/path/to/workspace/.a5c/plugins/babysitter/`.

## Agent workspace initialization

Install the blueprint through Babysitter's marketplace/install packaging when this repository is registered as a marketplace:

```sh
cd /path/to/workspace
babysitter blueprints:add-marketplace --marketplace-url https://github.com/calan-co/babysitter-dv.git --project --json
INSTALL_JSON=$(babysitter blueprints:install --plugin-name babysitter-dv --project --json)
PROCESS_FILE=$(node -e 'const fs=require("fs"); console.log(JSON.parse(fs.readFileSync(0,"utf8")).processFile)' <<EOF_JSON
$INSTALL_JSON
EOF_JSON
)
printf '{"dir":"%s","yes":true,"force":true}\n' "$PWD" > /tmp/babysitter-dv-install-inputs.json
RUN_JSON=$(babysitter run:create \
  --process-id babysitter-dv/install \
  --entry "$PROCESS_FILE#process" \
  --inputs /tmp/babysitter-dv-install-inputs.json \
  --non-interactive \
  --json)
RUN_DIR=$(node -e 'const fs=require("fs"); console.log(JSON.parse(fs.readFileSync(0,"utf8")).runDir)' <<EOF_JSON
$RUN_JSON
EOF_JSON
)
babysitter run:iterate "$RUN_DIR" --json
```

`blueprints:install` prints `install.md` and returns a `processFile`; it does not write files by itself. The `run:create` / `run:iterate` step above applies the install. Use `force:true` to refresh stale generated files.

For local development, the compatibility wrapper invokes the same blueprint `install-process.js` directly:

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

After initialization, interact through vanilla Babysitter. No `ports.mjs` is required for the default DV adapter; one call can drain ready DV backlog work until no unblocked candidates remain or a gate pauses:

```text
/babysitter:call systematically work through the ready DV backlog using the project Babysitter-DV process
```

or from a Pi session:

```text
/babysitter:call systematically work through the ready DV backlog using the project Babysitter-DV process
```

Shell note: current `genty` may ignore `--harness pi`; prefer the Pi slash command for Pi-backed runs. Use `genty` only for harnesses it actually honors in your installation.
