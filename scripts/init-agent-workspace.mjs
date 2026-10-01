#!/usr/bin/env node
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

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

Use this workflow for implementation work in an initialized workspace.

1. Inspect work:
   - \`dv work ready --json\`
   - \`dv work status <work-id> --json\` when diagnosing a specific item.
2. Use one dedicated git worktree per work item. Do not edit the base checkout for item implementation.
3. Run the Babysitter-DV blueprint for selected AFK-ready work. The v6 process lives at \`blueprints/babysitter-afk-v6/process.mjs\`.
4. Fail closed. Do not bypass publisher-owned selection, evidence manifest verification, independent review, closure, integration, or cleanup gates.
5. If Babysitter-DV pauses or rejects a boundary, report the blocker and preserve recovery artifacts.
6. Validate before completion:
   - focused test for the changed behavior
   - \`npm run check\`
   - \`npm run pilot:rehearse\` for release/MVP readiness from a clean checkout

Minimal command reminder:

\`\`\`sh
cd blueprints/babysitter-afk-v6
npm ci
babysitter run:create --process-id babysitter-afk-doc-vader --entry "$PWD/process.mjs#process" --inputs ./inputs.json --non-interactive --json
\`\`\`

Then continue with:

\`\`\`sh
babysitter run:iterate <run-directory> --json
babysitter run:events <run-directory> --json
\`\`\`
`;

const plannedFiles = ["AGENTS.md", ".pi/skills/babysitter-dv/SKILL.md"];

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
  print({ status: "written", dir: target, files: plannedFiles }, options.json);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
