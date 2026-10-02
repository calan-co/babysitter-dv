# Install Babysitter-DV

This blueprint installs a project-local Babysitter-DV process that can drain ready Doc-Vader work items through the vanilla Babysitter surface.

Important: `babysitter blueprints:install` prints these instructions and returns a `processFile`; it does not mutate the workspace by itself. Execute the returned install process to write the `.a5c/` files.

Example from a shell:

```sh
INSTALL_JSON=$(babysitter blueprints:install --plugin-name babysitter-dv --project --json)
PROCESS_FILE=$(node -e 'const fs=require("fs"); console.log(JSON.parse(fs.readFileSync(0,"utf8")).processFile)' <<EOF_JSON
$INSTALL_JSON
EOF_JSON
)
printf '{"dir":"%s","yes":true}\n' "$PWD" > /tmp/babysitter-dv-install-inputs.json
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

For local development in the Babysitter-DV repository, the compatibility wrapper runs the same install process directly:

```sh
npm run workspace:init -- --dir /path/to/workspace --yes
```

After install and repository-specific port configuration, run:

```text
/babysitter:call systematically work through the ready DV backlog using the project Babysitter-DV process
```

Shell equivalent:

```sh
genty call --harness <harness> --process .a5c/processes/babysitter-dv.js#process --workspace .
```

The install process writes `.a5c/processes/babysitter-dv.js`, `.a5c/processes/babysitter-dv/`, and blueprint documentation under `.a5c/blueprints/babysitter-dv/`.
