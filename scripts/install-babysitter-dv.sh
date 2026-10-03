#!/usr/bin/env sh
set -eu

usage() {
  cat <<'USAGE'
Install Babysitter-DV into a workspace.

Usage:
  install-babysitter-dv.sh [options]

Options:
  -w, --workspace DIR              Target workspace (default: current directory)
      --marketplace-url URL        Babysitter-DV marketplace repo URL
                                   (default: https://github.com/calan-co/babysitter-dv.git)
      --babysitter-source SPEC     npm package spec for Babysitter CLI
                                   (default: @a5c-ai/babysitter-sdk)
      --genty-source SPEC          npm package spec for Genty CLI
                                   (default: @a5c-ai/genty)
      --babysitter-pi-source SPEC  npm package spec/path for the Pi Babysitter plugin
                                   (default: @a5c-ai/babysitter-pi)
      --pi-source SPEC             optional npm package spec/path for the pi CLI
      --doc-vader-source SPEC      npm/pnpm package spec/path for Doc-Vader `dv`
      --skip-global-tools          Do not run npm install -g for Babysitter/Genty/Pi packages
      --skip-pi-plugin             Do not install the Pi Babysitter plugin into the workspace
      --no-force                   Do not force-refresh generated Babysitter-DV files
  -h, --help                       Show this help

Examples:
  ./scripts/install-babysitter-dv.sh --workspace ~/dev/personal/chris-cald/dewey

  curl -fsSL https://raw.githubusercontent.com/calan-co/babysitter-dv/main/scripts/install-babysitter-dv.sh \
    | sh -s -- --workspace "$PWD"

  curl -fsSL https://raw.githubusercontent.com/calan-co/babysitter-dv/main/scripts/install-babysitter-dv.sh \
    | sh -s -- --workspace ~/dev/personal/chris-cald/dewey \
      --babysitter-pi-source ~/dev/upstream/a5c-ai/babysitter-pi

Notes:
  - Requires node/npm. The script verifies `pi` and `dv` are on PATH.
  - Sources are npm package specs: published packages, dist-tags, tarballs, git URLs, or local paths.
  - If `dv` is missing, pass --doc-vader-source /path/to/doc-vader.
  - Start a fresh Babysitter run after reinstalling; do not recover stale runs.
USAGE
}

log() { printf '%s\n' "[babysitter-dv] $*" >&2; }
die() { printf '%s\n' "[babysitter-dv] ERROR: $*" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

workspace=$PWD
marketplace_url=https://github.com/calan-co/babysitter-dv.git
babysitter_source=@a5c-ai/babysitter-sdk
genty_source=@a5c-ai/genty
babysitter_pi_source=@a5c-ai/babysitter-pi
pi_source=
doc_vader_source=
skip_global_tools=0
skip_pi_plugin=0
force=true

while [ "$#" -gt 0 ]; do
  case "$1" in
    -w|--workspace) workspace=${2:?"--workspace requires a directory"}; shift 2 ;;
    --marketplace-url) marketplace_url=${2:?"--marketplace-url requires a URL"}; shift 2 ;;
    --babysitter-source) babysitter_source=${2:?"--babysitter-source requires a package spec"}; shift 2 ;;
    --genty-source) genty_source=${2:?"--genty-source requires a package spec"}; shift 2 ;;
    --babysitter-pi-source) babysitter_pi_source=${2:?"--babysitter-pi-source requires a package spec"}; shift 2 ;;
    --pi-source) pi_source=${2:?"--pi-source requires a package spec"}; shift 2 ;;
    --doc-vader-source) doc_vader_source=${2:?"--doc-vader-source requires a package spec"}; shift 2 ;;
    --skip-global-tools) skip_global_tools=1; shift ;;
    --skip-pi-plugin) skip_pi_plugin=1; shift ;;
    --no-force) force=false; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "unknown option: $1" ;;
  esac
done

[ -d "$workspace" ] || die "workspace does not exist: $workspace"
workspace=$(cd "$workspace" && pwd)
cd "$workspace"

have node || die "node is required: https://nodejs.org/en/download"
have npm || die "npm is required: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm"

if [ "$skip_global_tools" -eq 0 ]; then
  log "installing Babysitter/Genty/Pi plugin npm packages globally"
  npm install -g "$babysitter_source" "$genty_source" "$babysitter_pi_source"
  if [ -n "$pi_source" ]; then
    log "installing pi CLI from $pi_source"
    npm install -g "$pi_source"
  fi
fi

if [ -n "$doc_vader_source" ]; then
  if have pnpm; then
    log "installing Doc-Vader from $doc_vader_source with pnpm"
    pnpm install -g "$doc_vader_source"
  else
    log "installing Doc-Vader from $doc_vader_source with npm"
    npm install -g "$doc_vader_source"
  fi
fi

have babysitter || die "babysitter CLI is missing after install: https://github.com/a5c-ai/babysitter/tree/main/packages/babysitter#readme"
have genty || die "genty CLI is missing after install: https://github.com/a5c-ai/babysitter/tree/main/packages/genty/cli#readme"
have pi || die "pi CLI is missing; install Pi first or rerun with --pi-source <package-spec>: https://pi.dev/"
have dv || die "dv CLI is missing; install Doc-Vader or rerun with --doc-vader-source /path/to/doc-vader"

if [ "$skip_pi_plugin" -eq 0 ]; then
  log "installing Pi Babysitter plugin into $workspace"
  if [ "$babysitter_pi_source" = "@a5c-ai/babysitter-pi" ]; then
    babysitter harness:install-plugin pi --workspace "$workspace" --json >/dev/null
  else
    npm exec --yes --package "$babysitter_pi_source" -- babysitter-pi install --workspace "$workspace"
  fi
fi

log "adding or updating Babysitter-DV blueprint marketplace"
if ! babysitter blueprints:add-marketplace --marketplace-url "$marketplace_url" --project --json >/tmp/babysitter-dv-add-marketplace.$$ 2>/tmp/babysitter-dv-add-marketplace.err.$$; then
  log "marketplace add did not complete; trying update"
  babysitter blueprints:update-marketplace --marketplace-name babysitter-dv --project --json >/dev/null
fi
rm -f /tmp/babysitter-dv-add-marketplace.$$ /tmp/babysitter-dv-add-marketplace.err.$$

log "resolving Babysitter-DV install process"
install_json=$(babysitter blueprints:install --plugin-name babysitter-dv --project --json)
process_file=$(printf '%s' "$install_json" | node -e 'const fs=require("fs"); const input=fs.readFileSync(0,"utf8"); const parsed=JSON.parse(input); if (!parsed.processFile) process.exit(2); console.log(parsed.processFile)')

inputs_file=$(mktemp "${TMPDIR:-/tmp}/babysitter-dv-install-inputs.XXXXXX.json")
run_json_file=$(mktemp "${TMPDIR:-/tmp}/babysitter-dv-install-run.XXXXXX.json")
trap 'rm -f "$inputs_file" "$run_json_file"' EXIT HUP INT TERM
node -e 'const fs=require("fs"); const [file, dir, force] = process.argv.slice(1); fs.writeFileSync(file, JSON.stringify({dir, yes:true, force: force === "true"}) + "\n")' "$inputs_file" "$workspace" "$force"

log "running Babysitter-DV install process"
babysitter run:create \
  --process-id babysitter-dv/install \
  --entry "$process_file#process" \
  --inputs "$inputs_file" \
  --non-interactive \
  --json > "$run_json_file"
run_dir=$(node -e 'const fs=require("fs"); const parsed=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); if (!parsed.runDir) process.exit(2); console.log(parsed.runDir)' "$run_json_file")
babysitter run:iterate "$run_dir" --json >/dev/null

ports_file=.a5c/processes/babysitter-dv/ports.mjs
if [ -f "$ports_file" ] && grep -q 'Configure repository-specific Babysitter-DV ports' "$ports_file"; then
  log "removing stale generated ports.mjs stub"
  rm -f "$ports_file"
elif [ -f "$ports_file" ]; then
  log "leaving existing optional ports file: $ports_file"
fi

log "verifying installation"
test -f .a5c/processes/babysitter-dv.js
test -f .a5c/processes/babysitter-dv/process.mjs
grep -q 'decisionArtifact: { command, result: artifact }' .a5c/processes/babysitter-dv/process.mjs
grep -q 'babysitter-dv-default-delivery-gates' .a5c/processes/babysitter-dv/process.mjs
babysitter session:whoami --harness pi --json >/dev/null
dv work ready --json >/dev/null

cat <<DONE
Babysitter-DV installed in $workspace

Run from a Pi session:
  /babysitter:call systematically work through the ready DV backlog using the project Babysitter-DV process
DONE
