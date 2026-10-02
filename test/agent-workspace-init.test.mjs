import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const script = path.join(root, "scripts", "init-agent-workspace.mjs");
const run = (...args) => execFileSync(process.execPath, [script, ...args], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const runFailure = (...args) => spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: "utf8" });

test("agent workspace initializer previews and writes reusable babysitter-dv policy files", async () => {
  const target = mkdtempSync(path.join(os.tmpdir(), "babysitter-dv-init-"));
  try {
    const preview = JSON.parse(run("--dir", target, "--dry-run", "--json"));
    assert.equal(preview.status, "planned");
    assert.ok(preview.files.includes(".pi/skills/babysitter-dv/SKILL.md"));
    assert.ok(preview.files.includes("AGENTS.md"));
    assert.ok(preview.files.includes(".babysitter-dv/package.json"));
    assert.ok(preview.files.includes(".babysitter-dv/blueprints/babysitter-afk-v6/process.mjs"));
    assert.ok(preview.files.includes(".babysitter-dv/src/afk-delivery-blueprint.js"));

    const written = JSON.parse(run("--dir", target, "--yes", "--json"));
    assert.equal(written.status, "written");
    for (const file of preview.files) assert.equal(existsSync(path.join(target, file)), true, file);

    const agents = readFileSync(path.join(target, "AGENTS.md"), "utf8");
    assert.match(agents, /dv work ready --json/);
    assert.match(agents, /dedicated git worktree/i);
    assert.match(agents, /babysitter-dv/i);

    const skill = readFileSync(path.join(target, ".pi/skills/babysitter-dv/SKILL.md"), "utf8");
    assert.match(skill, /name: babysitter-dv/);
    assert.match(skill, /fail closed/i);
    assert.match(skill, /\/babysitter:call/);
    assert.match(skill, /genty call/);
    assert.doesNotMatch(skill, /run:create/);
    assert.match(skill, /\.babysitter-dv\/blueprints\/babysitter-afk-v6\/process\.mjs/);
    const processFile = path.join(target, ".babysitter-dv/blueprints/babysitter-afk-v6/process.mjs");
    assert.equal(existsSync(processFile), true);
    const runtimePackage = JSON.parse(readFileSync(path.join(target, ".babysitter-dv/package.json"), "utf8"));
    assert.equal(runtimePackage.type, "module");
    assert.equal(existsSync(path.join(target, ".babysitter-dv/blueprints/babysitter-afk-v6/package-lock.json")), true);
    assert.equal(existsSync(path.join(target, ".babysitter-dv/src/afk-delivery-blueprint.js")), true);
    assert.equal(typeof (await import(pathToFileURL(processFile))).process, "function");
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test("agent workspace initializer preserves existing AGENTS.md and appends a managed policy block", () => {
  const target = mkdtempSync(path.join(os.tmpdir(), "babysitter-dv-init-"));
  try {
    writeFileSync(path.join(target, "AGENTS.md"), "# Existing policy\n\nKeep this.\n");
    const written = JSON.parse(run("--dir", target, "--yes", "--json"));
    assert.equal(written.status, "written");

    const agents = readFileSync(path.join(target, "AGENTS.md"), "utf8");
    assert.match(agents, /# Existing policy/);
    assert.match(agents, /Keep this\./);
    assert.match(agents, /BEGIN babysitter-dv policy/);
    assert.match(agents, /dv work ready --json/);

    JSON.parse(run("--dir", target, "--yes", "--json"));
    const rerun = readFileSync(path.join(target, "AGENTS.md"), "utf8");
    assert.equal((rerun.match(/BEGIN babysitter-dv policy/g) ?? []).length, 1);
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test("agent workspace initializer refuses to overwrite custom runtime files without --force", () => {
  const target = mkdtempSync(path.join(os.tmpdir(), "babysitter-dv-init-"));
  try {
    JSON.parse(run("--dir", target, "--yes", "--json"));
    const runtime = path.join(target, ".babysitter-dv/src/afk-delivery-blueprint.js");
    writeFileSync(runtime, "custom runtime\n");
    const blocked = runFailure("--dir", target, "--yes", "--json");
    assert.notEqual(blocked.status, 0);
    assert.match(blocked.stderr, /runtime|overwrite|force/i);
    const forced = JSON.parse(run("--dir", target, "--yes", "--force", "--json"));
    assert.equal(forced.status, "written");
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test("agent workspace initializer refuses to overwrite a custom babysitter-dv skill without --force", () => {
  const target = mkdtempSync(path.join(os.tmpdir(), "babysitter-dv-init-"));
  try {
    const skill = path.join(target, ".pi/skills/babysitter-dv/SKILL.md");
    writeFileSync(path.join(target, "AGENTS.md"), "# Existing policy\n\nKeep this.\n");
    JSON.parse(run("--dir", target, "--yes", "--json"));
    writeFileSync(skill, "custom skill\n");
    const blocked = runFailure("--dir", target, "--yes", "--json");
    assert.notEqual(blocked.status, 0);
    assert.match(blocked.stderr, /skill|overwrite|force/i);
    const forced = JSON.parse(run("--dir", target, "--yes", "--force", "--json"));
    assert.equal(forced.status, "written");
    const agents = readFileSync(path.join(target, "AGENTS.md"), "utf8");
    assert.match(agents, /# Existing policy/);
    assert.match(agents, /Keep this\./);
    assert.match(agents, /BEGIN babysitter-dv policy/);
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});
