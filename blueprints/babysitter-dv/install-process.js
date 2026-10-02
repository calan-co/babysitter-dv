import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const PROCESS_ROOT = ".a5c/processes/babysitter-dv";
const BLUEPRINT_ROOT = ".a5c/blueprints/babysitter-dv";
const PROCESS_INDEX_PACKAGE = `${JSON.stringify({ type: "commonjs" }, null, 2)}\n`;
const PROCESS_WRAPPER = `exports.process = async function babysitterDv(inputs, ctx) {\n  return (await import("./babysitter-dv/process.mjs")).process(inputs, ctx);\n};\n`;

const PROCESS = `import { execFile, execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { createAfkDeliveryBlueprint } from "./src/afk-delivery-blueprint.js";
import { createEvidenceJournal } from "./src/evidence-manifest.js";

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

async function optionalOverridePorts(configModule, runInput) {
  if (!configModule) return null;
  const config = await import(configModule.startsWith("file:") ? configModule : new URL(configModule, "file://").href);
  const resolvePorts = config.createPorts ?? config.default;
  if (typeof resolvePorts !== "function") throw new TypeError("config module must export createPorts(inputs) or default(inputs)");
  return resolvePorts(runInput);
}

function createDefaultPorts({ ctx, workspace }) {
  return {
    publisherSelection: {
      async select(request) {
        const workItemId = request?.request?.workItemId;
        const stdout = execFileSync("dv", ["work", "select", workItemId, "--request", "-", "--json"], {
          cwd: workspace,
          input: JSON.stringify(request),
          encoding: "utf8",
        });
        return JSON.parse(stdout);
      },
    },
    journalFactory: createEvidenceJournal,
    state: { async transition(event) { return event; } },
    worktreeTransaction: {
      withEvidenceGuard() {},
      async prepareItem({ itemId, cwd, targetBranch } = {}) {
        const worktreeRoot = path.join(workspace, ".a5c/worktrees");
        mkdirSync(worktreeRoot, { recursive: true });
        const worktree = path.join(worktreeRoot, itemId);
        execFileSync("git", ["worktree", "add", "--detach", worktree, targetBranch ?? "HEAD"], { cwd, stdio: "ignore" });
        return { itemId, worktree, targetBranch: targetBranch ?? null };
      },
    },
    delivery: {
      async review({ item, implementer } = {}) {
        const itemId = item?.itemId;
        const prompt = "Resolve DV work item " + itemId + " in dedicated worktree " + item.worktree + " for workspace " + workspace + ". Use Doc-Vader for work item status/closure, keep evidence in the Babysitter-DV run directory, run focused validation and independent review, then integrate through the repository git policy. Return a JSON object with status \\\"delivered\\\" only after DV closure and integration are complete; otherwise return status \\\"paused\\\" with a reason and recovery notes.";
        if (typeof ctx?.task !== "function") return { status: "paused", reason: "Babysitter task context unavailable for default implementation adapter", itemId };
        const task = Object.assign(() => ({
          kind: "agent",
          title: "Resolve " + itemId,
          description: prompt,
          agent: { name: implementer ?? "babysitter-dv-implementer", prompt },
        }), { id: "babysitter-dv-default-implementation" });
        const result = await ctx.task(task, { itemId, workspace, worktree: item.worktree, prompt });
        return result && typeof result.status === "string" ? result : { status: "paused", reason: "implementation task did not return a delivery outcome", result };
      },
    },
  };
}

async function runItem({ configModule, runInput, ctx, workspace }) {
  const ports = await optionalOverridePorts(configModule, runInput) ?? createDefaultPorts({ ctx, workspace });
  return createAfkDeliveryBlueprint(ports).run(runInput);
}

/** Project-local Babysitter-DV process. With no itemId, drains ready DV work until empty or halted. */
export async function process(inputs = {}, ctx) {
  if (!inputs || typeof inputs !== "object") throw new TypeError("Babysitter-DV inputs must be an object");
  const workspace = path.resolve(inputs.workspace ?? inputs.runInput?.cwd ?? globalThis.process.cwd());
  const configModule = inputs.configModule ? path.resolve(inputs.configModule) : null;
  if (configModule && !configModule.endsWith(".mjs")) throw new TypeError("configModule must be a local .mjs module");

  if (typeof inputs.runInput?.itemId === "string" && inputs.runInput.itemId.length > 0) {
    const runInput = { ...inputs.runInput, cwd: inputs.runInput.cwd ?? workspace, runDirectory: inputs.runInput.runDirectory ?? path.join(workspace, ".a5c/runs", inputs.runInput.itemId) };
    const outcome = await runItem({ configModule, runInput, ctx, workspace });
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
    const outcome = await runItem({ configModule, runInput, ctx, workspace });
    completed.push({ itemId, outcome });
    if (outcome?.status !== "delivered") return halt(ctx, "babysitter-dv-paused", { itemId, outcome, completed });
  }
}
`;
const PROCESS_PACKAGE = `${JSON.stringify({ type: "module" }, null, 2)}\n`;
const INPUTS_EXAMPLE = `${JSON.stringify({
  workspace: "/absolute/path/to/workspace",
  runInput: {}
}, null, 2)}\n`;
const INSTALL_MD = await readFile(path.join(path.dirname(fileURLToPath(import.meta.url)), "install.md"), "utf8");
const CONFIGURE_MD = await readFile(path.join(path.dirname(fileURLToPath(import.meta.url)), "configure.md"), "utf8");

const GENERATED = new Map([
  [".a5c/processes/package.json", PROCESS_INDEX_PACKAGE],
  [".a5c/processes/babysitter-dv.js", PROCESS_WRAPPER],
  [`${PROCESS_ROOT}/package.json`, PROCESS_PACKAGE],
  [`${PROCESS_ROOT}/process.mjs`, PROCESS],
  [`${PROCESS_ROOT}/inputs.example.json`, INPUTS_EXAMPLE],
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
