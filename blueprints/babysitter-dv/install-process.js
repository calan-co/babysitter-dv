import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
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
const INSTALL_MD = await readFile(path.join(path.dirname(fileURLToPath(import.meta.url)), "install.md"), "utf8");
const CONFIGURE_MD = await readFile(path.join(path.dirname(fileURLToPath(import.meta.url)), "configure.md"), "utf8");

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
  "afk-delivery-blueprint.js",
  "doc-vader-contract.mjs",
  "evidence-manifest.js",
  "git-worktree-transaction.js",
  "node-acceptance-discovery.js",
  "publisher-work-selection.js",
  "repository-override-loader.js",
  "review-remediation-coordinator.js",
];
const processTarget = (name) => `${PROCESS_ROOT}/src/${name}`;
export const plannedFiles = [...GENERATED.keys(), ...SOURCE_FILES.map(processTarget)];

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

export async function process(inputs = {}) {
  const target = path.resolve(inputs.dir ?? inputs.targetDir ?? inputs.workspace ?? globalThis.process.cwd());
  if (inputs.dryRun) return { status: "planned", dir: target, files: plannedFiles };
  if (!inputs.yes && !inputs.apply) throw new Error("refusing to write without yes/apply");

  for (const [name, contents] of GENERATED) await writeManagedFile(target, name, contents, Boolean(inputs.force));
  for (const name of SOURCE_FILES) await writeManagedFile(target, processTarget(name), await readFile(path.join(packageRoot, "runtime/src", name)), Boolean(inputs.force));
  return { status: "written", dir: target, files: plannedFiles };
}

export default process;
