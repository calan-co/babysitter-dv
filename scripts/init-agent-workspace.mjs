#!/usr/bin/env node
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROCESS_ROOT = ".a5c/processes/babysitter-dv";
const BLUEPRINT_ROOT = ".a5c/blueprints/babysitter-dv";
const PROCESS_INDEX_PACKAGE = `${JSON.stringify({ type: "commonjs" }, null, 2)}\n`;
const PROCESS_WRAPPER = `exports.process = async function babysitterDv(inputs, ctx) {\n  return (await import("./babysitter-dv/process.mjs")).process(inputs, ctx);\n};\n`;

const PROCESS = `import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import { createAfkDeliveryBlueprint } from "./src/afk-delivery-blueprint.js";

const execFileAsync = promisify(execFile);

async function readyItemIds(cwd) {
  const { stdout } = await execFileAsync("dv", ["work", "ready", "--json"], { cwd });
  const result = JSON.parse(stdout);
  if (!Array.isArray(result.candidates)) throw new TypeError("dv work ready --json did not return candidates");
  return result.candidates.map((item) => item.id).filter((id) => typeof id === "string" && id.length > 0);
}

function halt(ctx, reason, payload) {
  if (typeof ctx?.halt === "function") return ctx.halt(reason, payload);
  return { halt: true, reason, payload };
}

async function runItem({ configModule, runInput }) {
  const config = await import(pathToFileURL(configModule).href);
  const resolvePorts = config.createPorts ?? config.default;
  if (typeof resolvePorts !== "function") throw new TypeError("config module must export createPorts(inputs) or default(inputs)");
  return createAfkDeliveryBlueprint(await resolvePorts(runInput)).run(runInput);
}

/** Project-local Babysitter-DV process. With no itemId, drains ready DV work until empty or halted. */
export async function process(inputs = {}, ctx) {
  if (!inputs || typeof inputs !== "object") throw new TypeError("Babysitter-DV inputs must be an object");
  const workspace = path.resolve(inputs.workspace ?? inputs.runInput?.cwd ?? globalThis.process.cwd());
  const configModule = path.resolve(inputs.configModule ?? path.join(workspace, ".a5c/processes/babysitter-dv/ports.mjs"));
  if (!configModule.endsWith(".mjs")) throw new TypeError("configModule must be a local .mjs module");

  if (typeof inputs.runInput?.itemId === "string" && inputs.runInput.itemId.length > 0) {
    const runInput = { ...inputs.runInput, cwd: inputs.runInput.cwd ?? workspace, runDirectory: inputs.runInput.runDirectory ?? path.join(workspace, ".a5c/runs", inputs.runInput.itemId) };
    const outcome = await runItem({ configModule, runInput });
    return outcome?.status === "delivered" ? outcome : halt(ctx, "babysitter-dv-paused", { itemId: runInput.itemId, outcome });
  }

  const completed = [];
  const attempted = new Set();
  while (true) {
    const ready = await readyItemIds(workspace);
    if (ready.length === 0) return { status: "drained", completed };
    const itemId = ready.find((id) => !attempted.has(id));
    if (!itemId) return halt(ctx, "babysitter-dv-stalled", { reason: "ready candidates did not change after attempted delivery", ready, completed });
    attempted.add(itemId);
    const runInput = { ...(inputs.runInput ?? {}), itemId, cwd: workspace, runDirectory: path.join(workspace, ".a5c/runs", itemId) };
    const outcome = await runItem({ configModule, runInput });
    completed.push({ itemId, outcome });
    if (outcome?.status !== "delivered") return halt(ctx, "babysitter-dv-paused", { itemId, outcome, completed });
  }
}
`;

const PROCESS_PACKAGE = `${JSON.stringify({ type: "module" }, null, 2)}\n`;
const INPUTS_EXAMPLE = `${JSON.stringify({
  workspace: "/absolute/path/to/workspace",
  configModule: "/absolute/path/to/workspace/.a5c/processes/babysitter-dv/ports.mjs",
  runInput: {}
}, null, 2)}\n`;
const PORTS_EXAMPLE = `export async function createPorts(runInput) {
  throw new Error("Configure repository-specific Babysitter-DV ports before running " + runInput.itemId);
}
`;
const INSTALL_MD = `# Install Babysitter-DV\n\nThis workspace is initialized for vanilla Babysitter. A simple Babysitter call can drain ready DV work by using the project-local process.\n\n/babysitter:call systematically work through the ready DV backlog using the project Babysitter-DV process\n\nShell equivalent:\n\ngenty call --harness <harness> --process .a5c/processes/babysitter-dv.js#process --workspace .\n`;
const CONFIGURE_MD = `# Configure Babysitter-DV\n\nCreate .a5c/processes/babysitter-dv/ports.mjs from ports.example.mjs. The module must export createPorts(runInput) or a default function that returns stack-neutral ports for the selected DV work item. With no itemId input, the process repeatedly calls dv work ready --json and runs ready candidates until none remain or a gate pauses.\n`;

const GENERATED = new Map([
  [".a5c/processes/package.json", PROCESS_INDEX_PACKAGE],
  [".a5c/processes/babysitter-dv.js", PROCESS_WRAPPER],
  [`${PROCESS_ROOT}/package.json`, PROCESS_PACKAGE],
  [`${PROCESS_ROOT}/process.mjs`, PROCESS],
  [`${PROCESS_ROOT}/inputs.example.json`, INPUTS_EXAMPLE],
  [`${PROCESS_ROOT}/ports.example.mjs`, PORTS_EXAMPLE],
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
