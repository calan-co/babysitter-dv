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

test("workspace initializer previews and writes Babysitter-native project files", async () => {
  const target = mkdtempSync(path.join(os.tmpdir(), "babysitter-dv-init-"));
  try {
    const preview = JSON.parse(run("--dir", target, "--dry-run", "--json"));
    assert.equal(preview.status, "planned");
    assert.ok(preview.files.includes(".a5c/processes/babysitter-dv/process.mjs"));
    assert.ok(preview.files.includes(".a5c/processes/babysitter-dv/package.json"));
    assert.ok(preview.files.includes(".a5c/processes/babysitter-dv/inputs.example.json"));
    assert.ok(preview.files.includes(".a5c/processes/babysitter-dv/src/afk-delivery-blueprint.js"));
    assert.ok(preview.files.includes(".a5c/blueprints/babysitter-dv/install.md"));
    assert.ok(!preview.files.some((file) => file.startsWith(".pi/") || file === "AGENTS.md"));

    const written = JSON.parse(run("--dir", target, "--yes", "--json"));
    assert.equal(written.status, "written");
    for (const file of preview.files) assert.equal(existsSync(path.join(target, file)), true, file);

    const install = readFileSync(path.join(target, ".a5c/blueprints/babysitter-dv/install.md"), "utf8");
    assert.match(install, /\/babysitter:call/);
    assert.match(install, /genty call/);
    assert.match(install, /--process \.a5c\/processes\/babysitter-dv\/process\.mjs#process/);

    const processFile = path.join(target, ".a5c/processes/babysitter-dv/process.mjs");
    const processPackage = JSON.parse(readFileSync(path.join(target, ".a5c/processes/babysitter-dv/package.json"), "utf8"));
    assert.equal(processPackage.type, "module");
    assert.equal(typeof (await import(pathToFileURL(processFile))).process, "function");
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test("workspace initializer leaves existing AGENTS.md untouched", () => {
  const target = mkdtempSync(path.join(os.tmpdir(), "babysitter-dv-init-"));
  try {
    const agentsPath = path.join(target, "AGENTS.md");
    writeFileSync(agentsPath, "# Existing policy\n\nKeep this.\n");
    JSON.parse(run("--dir", target, "--yes", "--json"));
    assert.equal(readFileSync(agentsPath, "utf8"), "# Existing policy\n\nKeep this.\n");
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test("workspace initializer refuses to overwrite custom process files without --force", () => {
  const target = mkdtempSync(path.join(os.tmpdir(), "babysitter-dv-init-"));
  try {
    JSON.parse(run("--dir", target, "--yes", "--json"));
    const runtime = path.join(target, ".a5c/processes/babysitter-dv/src/afk-delivery-blueprint.js");
    writeFileSync(runtime, "custom runtime\n");
    const blocked = runFailure("--dir", target, "--yes", "--json");
    assert.notEqual(blocked.status, 0);
    assert.match(blocked.stderr, /overwrite|force/i);
    const forced = JSON.parse(run("--dir", target, "--yes", "--force", "--json"));
    assert.equal(forced.status, "written");
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});
