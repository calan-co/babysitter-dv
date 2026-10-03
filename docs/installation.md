# Installation

Babysitter-DV installs as a Babysitter blueprint into a target workspace. The default adapter needs these commands on `PATH`:

- `node` / `npm` — [Node.js downloads](https://nodejs.org/en/download) and [npm install docs](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- `babysitter` — [Babysitter package README](https://github.com/a5c-ai/babysitter/tree/main/packages/babysitter#readme)
- `genty` — [Genty CLI README](https://github.com/a5c-ai/babysitter/tree/main/packages/genty/cli#readme)
- `pi` — [Pi](https://pi.dev/) / [Pi coding-agent package](https://github.com/earendil-works/pi/tree/main/packages/coding-agent)
- `dv` — Doc-Vader CLI (`@calan-co/doc-vader`); install from your internal Doc-Vader source or distribution
- optional `pnpm` for local/internal Doc-Vader installs — [pnpm installation](https://pnpm.io/installation)

## Script method

For the normal path, run the installer script directly from GitHub in the target workspace:

```sh
cd /path/to/workspace
curl -fsSL https://raw.githubusercontent.com/calan-co/babysitter-dv/main/scripts/install-babysitter-dv.sh \
  | sh -s -- --workspace "$PWD"
```

If `dv` is not already installed but you have Doc-Vader source locally:

```sh
curl -fsSL https://raw.githubusercontent.com/calan-co/babysitter-dv/main/scripts/install-babysitter-dv.sh \
  | sh -s -- --workspace /path/to/workspace --doc-vader-source /path/to/doc-vader
```

If you want the workspace Pi plugin from a local checkout instead of the published package:

```sh
curl -fsSL https://raw.githubusercontent.com/calan-co/babysitter-dv/main/scripts/install-babysitter-dv.sh \
  | sh -s -- --workspace ~/dev/personal/chris-cald/dewey \
    --babysitter-pi-source ~/dev/upstream/a5c-ai/babysitter-pi
```

Useful options:

```text
--workspace DIR              target workspace; default is current directory
--babysitter-source SPEC     npm package spec for Babysitter CLI; default @a5c-ai/babysitter-sdk
--genty-source SPEC          npm package spec for Genty CLI; default @a5c-ai/genty
--babysitter-pi-source SPEC  npm package spec/path for the Pi Babysitter plugin; default @a5c-ai/babysitter-pi
--pi-source SPEC             optional npm package spec/path for the pi CLI
--doc-vader-source SPEC      npm/pnpm package spec/path for Doc-Vader `dv`
--skip-global-tools          skip npm global install for Babysitter/Genty/Pi plugin packages
--skip-pi-plugin             skip workspace Pi Babysitter plugin install
--no-force                   do not force-refresh generated Babysitter-DV files
--help                       show script usage
```

The script performs the manual steps below: installs global npm packages from the configured package specs, optionally installs Doc-Vader and/or Pi from custom sources, installs the workspace Pi plugin, adds or updates the Babysitter-DV marketplace, runs the blueprint install process, removes the old generated `ports.mjs` stub if present, and verifies the result.

## Manual method

Use this if you prefer to run each step explicitly or need to debug an install.

### 1. Install global tools

```sh
npm install -g @a5c-ai/babysitter-sdk @a5c-ai/genty @a5c-ai/babysitter-pi

# Install Doc-Vader from your internal package/source. Example:
# pnpm install -g /path/to/doc-vader

command -v babysitter genty pi dv
```

If `pi` is missing, install it using the Pi docs linked above.

### 2. Install the Pi Babysitter plugin into a workspace

```sh
cd /path/to/workspace
babysitter harness:install-plugin pi --workspace "$PWD" --json
```

This writes the Pi plugin under:

```text
.a5c/plugins/babysitter/
```

### 3. Install or update Babysitter-DV in the workspace

Fresh workspace:

```sh
cd /path/to/workspace
babysitter blueprints:add-marketplace \
  --marketplace-url https://github.com/calan-co/babysitter-dv.git \
  --project \
  --json
```

Existing marketplace clone:

```sh
babysitter blueprints:update-marketplace \
  --marketplace-name babysitter-dv \
  --project \
  --json
```

Apply the blueprint install process:

```sh
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

`force:true` refreshes stale generated process files. No `ports.mjs` is required; delete an old generated stub if one remains.

### 4. Verify

```sh
test -f .a5c/processes/babysitter-dv.js
test -f .a5c/processes/babysitter-dv/process.mjs
test ! -f .a5c/processes/babysitter-dv/ports.mjs

grep -q 'babysitter-dv-default-delivery-gates' .a5c/processes/babysitter-dv/process.mjs
grep -q 'decisionArtifact: { command, result: artifact }' .a5c/processes/babysitter-dv/process.mjs

dv work ready --json
babysitter session:whoami --harness pi --json
```

### 5. Run with Pi

From a Pi session in the workspace:

```text
/babysitter:call systematically work through the ready DV backlog using the project Babysitter-DV process
```

Start a fresh run after reinstalling. Do not recover old runs that captured stale process code.

Current `genty` builds may ignore `--harness pi`; for Pi-backed runs, prefer the Pi slash command above.
