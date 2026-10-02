#!/usr/bin/env node
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROCESS_ROOT = ".a5c/processes/babysitter-dv";
const BLUEPRINT_ROOT = ".a5c/blueprints/babysitter-dv";

const PROCESS = `import path from "node:path";
import { pathToFileURL } from "node:url";
import { createAfkDeliveryBlueprint } from "./src/afk-delivery-blueprint.js";

/**
 * Project-local Babysitter-DV process. JSON inputs select an importable local
 * adapter module; executable ports never cross the JSON boundary.
 */
export async function process(inputs = {}) {
  if (!inputs || typeof inputs !== "object" || typeof inputs.configModule !== "string" || !inputs.runInput || typeof inputs.runInput !== "object") {
    throw new TypeError("Babysitter-DV inputs require configModule and runInput objects");
  }
  if (!path.isAbsolute(inputs.configModule) || inputs.configModule.includes("\\0") || !inputs.configModule.endsWith(".mjs")) {
    throw new TypeError("configModule must be an absolute local .mjs module");
  }
  const config = await import(pathToFileURL(inputs.configModule).href);
  const resolvePorts = config.createPorts ?? config.default;
  if (typeof resolvePorts !== "function") throw new TypeError("config module must export createPorts(inputs) or default(inputs)");
  return createAfkDeliveryBlueprint(await resolvePorts(inputs.runInput)).run(inputs.runInput);
}
`;

const PROCESS_PACKAGE = `${JSON.stringify({ type: "module" }, null, 2)}\n`;
const INPUTS_EXAMPLE = `${JSON.stringify({
  configModule: "/absolute/path/to/babysitter-ports.mjs",
  runInput: {
    itemId: "wi-123",
    cwd: "/absolute/path/to/workspace",
    runDirectory: "/absolute/path/to/workspace/.a5c/runs/wi-123",
  },
}, null, 2)}\n`;
const INSTALL_MD = `# Install Babysitter-DV\n\nThis workspace is initialized for vanilla Babysitter. Start from the normal Babysitter surface and point it at the project-local process:\n\n\`\`\`text\n/babysitter:call resolve the next ready DV work item using .a5c/processes/babysitter-dv/process.mjs\n\`\`\`\n\nShell equivalent:\n\n\`\`\`sh\ngenty call --harness <harness> --process .a5c/processes/babysitter-dv/process.mjs#process --inputs .a5c/processes/babysitter-dv/inputs.example.json --workspace .\n\`\`\`\n`;
const CONFIGURE_MD = `# Configure Babysitter-DV\n\nEdit or generate an inputs JSON matching \`.a5c/processes/babysitter-dv/inputs.example.json\`. The \`configModule\` must export \`createPorts(runInput)\` or a default function that returns the stack-neutral ports for this repository.\n`;

const GENERATED = new Map([
  [`${PROCESS_ROOT}/package.json`, PROCESS_PACKAGE],
  [`${PROCESS_ROOT}/process.mjs`, PROCESS],
  [`${PROCESS_ROOT}/inputs.example.json`, INPUTS_EXAMPLE],
  [`${BLUEPRINT_ROOT}/install.md`, INSTALL_MD],
  [`${BLUEPRINT_ROOT}/configure.md`, CONFIGURE_MD],
]);

const SOURCE_FILES = [
  "src/afk-delivery-blueprint.js",
  "src/doc-vader-contract.mjs",
  "src/evidence-manifest.js",
  "src/git-worktree-transaction.js",
  "src/node-acceptance-discovery.js",
  "src/publisher-work-selection.js",
  "src/repository-override-loader.js",
  "src/review-remediation-coordinator.js",
];
const processTarget = (name) => `${PROCESS_ROOT}/${name}`;
const plannedFiles = [...GENERATED.keys(), ...SOURCE_FILES.map(processTarget)];

function parse(argv) {
  const options = { dir: process.cwd(), json: false, dryRun: false, yes: false, force: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dir") options.dir = argv[++i];
    else if (arg === "--json") options.json = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--yes") options.yes = true;
    else if (arg === "--force") options.force = true;
    else throw new Error(`unknown option ${arg}`);
  }
  return options;
}

function print(result, json) {
  if (json) console.log(JSON.stringify(result, null, 2));
  else console.log(`${result.status}: ${result.files.join(", ")}`);
}

async function writeManagedFile(targetRoot, name, contents, force) {
  const target = path.join(targetRoot, name);
  const body = Buffer.isBuffer(contents) ? contents : Buffer.from(contents);
  if (existsSync(target)) {
    const current = await readFile(target);
    if (!current.equals(body) && !force) throw new Error(`refusing to overwrite existing Babysitter-DV file without --force: ${name}`);
  }
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, body);
}

try {
  const options = parse(process.argv.slice(2));
  const target = path.resolve(options.dir);
  if (options.dryRun) {
    print({ status: "planned", dir: target, files: plannedFiles }, options.json);
    process.exit(0);
  }
  if (!options.yes) throw new Error("refusing to write without --yes");

  for (const [name, contents] of GENERATED) await writeManagedFile(target, name, contents, options.force);
  for (const name of SOURCE_FILES) await writeManagedFile(target, processTarget(name), await readFile(path.join(sourceRoot, name)), options.force);
  print({ status: "written", dir: target, files: plannedFiles }, options.json);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
