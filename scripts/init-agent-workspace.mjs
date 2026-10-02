#!/usr/bin/env node
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AGENTS_START = "<!-- BEGIN babysitter-dv policy -->";
const AGENTS_END = "<!-- END babysitter-dv policy -->";
const AGENTS_POLICY = `${AGENTS_START}
# babysitter-dv workspace policy

For implementation work in this workspace:

- Track work in Doc-Vader (dv) work items. Prefer \`dv work ready --json\`; do not invent untracked tasks.
- Use one dedicated git worktree per work item before editing files.
- For ready AFK work, use babysitter-dv rather than ad-hoc delivery. Load the \`babysitter-dv\` skill for the runbook.
- Do not bypass publisher selection, evidence, review, closure, integration, or cleanup gates. If a gate fails closed, stop and report the blocker.
- Validate with the repository's pinned gates before claiming completion: \`npm run check\` and, for release readiness, \`npm run pilot:rehearse\` from a clean checkout.
${AGENTS_END}
`;

const SKILL = `---
name: babysitter-dv
description: Use when implementing or validating Doc-Vader work items with the Babysitter-DV delivery blueprint. Applies to requests mentioning dv work items, AFK delivery, MVP blockers, dedicated worktrees, or babysitter-dv.
---

# Babysitter-DV

Use vanilla Babysitter after workspace initialization. The target-local runtime lives at \`.babysitter-dv/blueprints/babysitter-afk-v6/process.mjs\`; do not point at the original \`babysitter-dv\` source checkout.

Start runs the normal Babysitter way:

\`\`\`text
/babysitter:call resolve the next ready DV work item with Babysitter-DV
\`\`\`

or, from a shell:

\`\`\`sh
genty call --harness <harness> --prompt "resolve the next ready DV work item with Babysitter-DV" --workspace .
\`\`\`

Workflow policy for the Babysitter run:

1. Inspect work:
   - \`dv work ready --json\`
   - \`dv work status <work-id> --json\` when diagnosing a specific item.
2. Use one dedicated git worktree per work item. Do not edit the base checkout for item implementation.
3. For selected AFK-ready work, use the injected Babysitter-DV runtime at \`.babysitter-dv/blueprints/babysitter-afk-v6/process.mjs\`.
4. Fail closed. Do not bypass publisher-owned selection, evidence manifest verification, independent review, closure, integration, or cleanup gates.
5. If Babysitter-DV pauses or rejects a boundary, report the blocker and preserve recovery artifacts.
6. Validate before completion:
   - focused test for the changed behavior
   - \`npm run check\`
   - \`npm run pilot:rehearse\` for release/MVP readiness from a clean checkout
`;

const RUNTIME_PACKAGE = `${JSON.stringify({ type: "module" }, null, 2)}\n`;

const RUNTIME_FILES = [
  "blueprints/babysitter-afk-v6/package-lock.json",
  "blueprints/babysitter-afk-v6/package.json",
  "blueprints/babysitter-afk-v6/process.mjs",
  "blueprints/babysitter-afk-v6/README.md",
  "src/afk-delivery-blueprint.js",
  "src/doc-vader-contract.mjs",
  "src/evidence-manifest.js",
  "src/git-worktree-transaction.js",
  "src/node-acceptance-discovery.js",
  "src/publisher-work-selection.js",
  "src/repository-override-loader.js",
  "src/review-remediation-coordinator.js",
];
const runtimeTarget = (name) => `.babysitter-dv/${name}`;
const plannedFiles = ["AGENTS.md", ".pi/skills/babysitter-dv/SKILL.md", ".babysitter-dv/package.json", ...RUNTIME_FILES.map(runtimeTarget)];

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

async function agentsContents(file) {
  if (!existsSync(file)) return AGENTS_POLICY;
  const current = await readFile(file, "utf8");
  const start = current.indexOf(AGENTS_START);
  const end = current.indexOf(AGENTS_END);
  if (start !== -1 && end !== -1 && end > start) {
    return `${current.slice(0, start)}${AGENTS_POLICY}${current.slice(end + AGENTS_END.length).replace(/^\n?/, "")}`;
  }
  return `${current.replace(/\s*$/, "\n\n")}${AGENTS_POLICY}`;
}

async function writeSkill(file, force) {
  if (existsSync(file)) {
    const current = await readFile(file, "utf8");
    if (current !== SKILL && !force) throw new Error(`refusing to overwrite existing babysitter-dv skill without --force: ${file}`);
  }
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, SKILL);
}

async function writeRuntimePackage(targetRoot, force) {
  const target = path.join(targetRoot, ".babysitter-dv/package.json");
  if (existsSync(target)) {
    const current = await readFile(target, "utf8");
    if (current !== RUNTIME_PACKAGE && !force) throw new Error("refusing to overwrite existing Babysitter-DV runtime file without --force: .babysitter-dv/package.json");
  }
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, RUNTIME_PACKAGE);
}

async function copyRuntimeFile(targetRoot, name, force) {
  const source = path.join(sourceRoot, name);
  const target = path.join(targetRoot, runtimeTarget(name));
  const contents = await readFile(source);
  if (existsSync(target)) {
    const current = await readFile(target);
    if (!current.equals(contents) && !force) throw new Error(`refusing to overwrite existing Babysitter-DV runtime file without --force: ${runtimeTarget(name)}`);
  }
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, contents);
}

try {
  const options = parse(process.argv.slice(2));
  const target = path.resolve(options.dir);
  if (options.dryRun) {
    print({ status: "planned", dir: target, files: plannedFiles }, options.json);
    process.exit(0);
  }
  if (!options.yes) throw new Error("refusing to write without --yes");

  const agents = path.join(target, "AGENTS.md");
  await mkdir(path.dirname(agents), { recursive: true });
  await writeFile(agents, await agentsContents(agents));
  await writeSkill(path.join(target, ".pi/skills/babysitter-dv/SKILL.md"), options.force);
  await writeRuntimePackage(target, options.force);
  for (const name of RUNTIME_FILES) await copyRuntimeFile(target, name, options.force);
  print({ status: "written", dir: target, files: plannedFiles }, options.json);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
