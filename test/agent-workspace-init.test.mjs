import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const script = path.join(root, "scripts", "init-agent-workspace.mjs");
const run = (...args) => execFileSync(process.execPath, [script, ...args], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const runFailure = (...args) => spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: "utf8" });

test("repository exposes self-contained Babysitter blueprint install packaging", async () => {
  const marketplace = JSON.parse(readFileSync(path.join(root, "marketplace.json"), "utf8"));
  assert.equal(marketplace.plugins["babysitter-dv"].packagePath, "blueprints/babysitter-dv");
  assert.equal(existsSync(path.join(root, "blueprints/babysitter-dv/install.md")), true);
  assert.equal(existsSync(path.join(root, "blueprints/babysitter-dv/configure.md")), true);
  const installProcess = await import(pathToFileURL(path.join(root, "blueprints/babysitter-dv/install-process.js")));
  assert.equal(typeof installProcess.process, "function");
  const preview = await installProcess.process({ dir: root, dryRun: true });
  assert.equal(preview.status, "planned");
  assert.ok(preview.files.includes(".a5c/processes/babysitter-dv.js"));

  const target = mkdtempSync(path.join(os.tmpdir(), "babysitter-dv-package-"));
  try {
    const packageCopy = path.join(target, "blueprint");
    cpSync(path.join(root, "blueprints/babysitter-dv"), packageCopy, { recursive: true });
    const copiedInstallProcess = await import(pathToFileURL(path.join(packageCopy, "install-process.js")));
    const installed = await copiedInstallProcess.process({ dir: target, yes: true });
    assert.equal(installed.status, "written");
    assert.equal(existsSync(path.join(target, ".a5c/processes/babysitter-dv/src/afk-delivery-blueprint.js")), true);
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test("workspace initializer writes a Babysitter-native backlog-drain process", async () => {
  const target = mkdtempSync(path.join(os.tmpdir(), "babysitter-dv-init-"));
  const oldPath = process.env.PATH;
  try {
    const preview = JSON.parse(run("--dir", target, "--dry-run", "--json"));
    assert.equal(preview.status, "planned");
    assert.ok(preview.files.includes(".a5c/processes/babysitter-dv.js"));
    assert.ok(preview.files.includes(".a5c/processes/package.json"));
    assert.ok(preview.files.includes(".a5c/processes/babysitter-dv/process.mjs"));
    assert.ok(preview.files.includes(".a5c/processes/babysitter-dv/ports.example.mjs"));
    assert.ok(preview.files.includes(".a5c/blueprints/babysitter-dv/install.md"));
    assert.ok(!preview.files.some((file) => file.startsWith(".pi/") || file === "AGENTS.md"));

    const written = JSON.parse(run("--dir", target, "--yes", "--json"));
    assert.equal(written.status, "written");
    for (const file of preview.files) assert.equal(existsSync(path.join(target, file)), true, file);

    const install = readFileSync(path.join(target, ".a5c/blueprints/babysitter-dv/install.md"), "utf8");
    assert.match(install, /\/babysitter:call/);
    assert.match(install, /genty call/);
    assert.match(install, /--process \.a5c\/processes\/babysitter-dv\.js#process/);

    const processFile = path.join(target, ".a5c/processes/babysitter-dv/process.mjs");
    const wrapperFile = path.join(target, ".a5c/processes/babysitter-dv.js");
    const processIndexPackage = JSON.parse(readFileSync(path.join(target, ".a5c/processes/package.json"), "utf8"));
    const processPackage = JSON.parse(readFileSync(path.join(target, ".a5c/processes/babysitter-dv/package.json"), "utf8"));
    assert.equal(processIndexPackage.type, "commonjs");
    assert.equal(processPackage.type, "module");
    const mod = await import(pathToFileURL(processFile));
    const wrapper = await import(pathToFileURL(wrapperFile));
    assert.equal(typeof mod.process, "function");
    assert.equal(typeof wrapper.process, "function");

    const bin = path.join(target, "bin");
    mkdirSync(bin);
    const dv = path.join(bin, "dv");
    writeFileSync(dv, "#!/bin/sh\nprintf '%s\\n' '{\"schemaVersion\":\"task-ready/v1\",\"candidates\":[]}'\n");
    chmodSync(dv, 0o755);
    process.env.PATH = `${bin}${path.delimiter}${oldPath}`;
    assert.deepEqual(await mod.process({ workspace: target }), { status: "drained", completed: [] });
  } finally {
    process.env.PATH = oldPath;
    rmSync(target, { recursive: true, force: true });
  }
});

test("generated backlog-drain process pauses on the first gated candidate", async () => {
  const target = mkdtempSync(path.join(os.tmpdir(), "babysitter-dv-init-"));
  const oldPath = process.env.PATH;
  try {
    JSON.parse(run("--dir", target, "--yes", "--json"));
    const bin = path.join(target, "bin");
    mkdirSync(bin);
    const dv = path.join(bin, "dv");
    writeFileSync(dv, "#!/bin/sh\nprintf '%s\\n' '{\"schemaVersion\":\"task-ready/v1\",\"candidates\":[{\"id\":\"wi-1\"}]}'\n");
    chmodSync(dv, 0o755);
    writeFileSync(path.join(target, ".a5c/processes/babysitter-dv/ports.mjs"), `
export function createPorts() {
  return {
    worktreeTransaction: { prepareItem() {}, withEvidenceGuard() {} },
    delivery: { review() {} },
    state: { transition() {} },
    journalFactory: async () => ({ runDirectory: "ignored", append: async () => {} }),
    publisherSelection: { select: async () => ({
      capability: "publisher-work-selection/v1",
      decisionArtifact: { command: ["dv"], result: { ok: true } },
      outcome: { kind: "not-selected", code: "test-gate" }
    }) }
  };
}
`);
    process.env.PATH = `${bin}${path.delimiter}${oldPath}`;
    const mod = await import(pathToFileURL(path.join(target, ".a5c/processes/babysitter-dv/process.mjs")));
    let halted;
    const ctx = { halt: (reason, payload) => { halted = { reason, payload }; return halted; } };
    const outcome = await mod.process({ workspace: target }, ctx);
    assert.equal(outcome, halted);
    assert.equal(outcome.reason, "babysitter-dv-paused");
    assert.equal(outcome.payload.itemId, "wi-1");
    assert.equal(outcome.payload.completed.length, 1);
  } finally {
    process.env.PATH = oldPath;
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
