# Install Babysitter-DV

This blueprint installs a project-local Babysitter-DV process that can drain ready Doc-Vader work items through the vanilla Babysitter surface.

## Dependencies

Install the Babysitter CLI, Genty, and the Pi Babysitter plugin globally:

```sh
npm install -g @a5c-ai/babysitter-sdk @a5c-ai/genty @a5c-ai/babysitter-pi
# Doc-Vader is the `dv` CLI. Install it from your Doc-Vader package/source, for example:
# pnpm install -g /path/to/doc-vader
command -v babysitter genty pi dv
```

Install the Pi plugin into the target workspace:

```sh
babysitter harness:install-plugin pi --workspace "$PWD" --json
```

## Install this blueprint into a workspace

Important: `babysitter blueprints:install` prints these instructions and returns a `processFile`; it does not mutate the workspace by itself. Execute the returned install process to write the `.a5c/` files.

```sh
babysitter blueprints:add-marketplace \
  --marketplace-url https://github.com/calan-co/babysitter-dv.git \
  --project \
  --json

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

Use `force:true` when reinstalling so stale generated process files are refreshed.

For local development in the Babysitter-DV repository, the compatibility wrapper runs the same install process directly:

```sh
npm run workspace:init -- --dir /path/to/workspace --yes --force
```

After install, run from Pi:

```text
/babysitter:call systematically work through the ready DV backlog using the project Babysitter-DV process
```

The install process writes `.a5c/processes/babysitter-dv.js`, `.a5c/processes/babysitter-dv/`, and blueprint documentation under `.a5c/blueprints/babysitter-dv/`.

No `ports.mjs` is required. If an old `.a5c/processes/babysitter-dv/ports.mjs` stub exists, delete it after reinstall.
