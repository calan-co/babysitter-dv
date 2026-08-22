import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// This is deliberately the public, built-in contract surface.  It must not
// consult backlog Markdown or repository configuration to make these calls.
const loadContract = () => import("../src/doc-vader-contract.mjs");

test("builds only the versioned built-in dv argv contracts", async () => {
  const { builtInCommands } = await loadContract();

  assert.deepEqual(builtInCommands.ready(), ["dv", "work", "ready", "--json"]);
  assert.deepEqual(builtInCommands.show("wi-002"), ["dv", "work", "show", "wi-002", "--json"]);
  assert.deepEqual(builtInCommands.validate("wi-002"), ["dv", "work", "status", "wi-002", "--validate", "--json"]);
  assert.deepEqual(builtInCommands.close("wi-002"), ["dv", "work", "close", "wi-002", "--json"]);
});

test("parses only the versioned canonical show, status/validate, and close results", async () => {
  const {
    parseCloseResult,
    parseShowResult,
    parseStatusValidateResult,
  } = await loadContract();
  const show = {
    schemaVersion: "task-model/v1",
    id: "wi-002",
    title: "A work item",
    filePath: "backlog/002-work.md",
    status: "ready",
    lifecycle: "active",
    tags: ["afk"],
    dependencies: [],
    body: { sections: [] },
    acceptanceCriteria: [],
    validation: { type: "work-item", subtype: "story", priority: "high", links: { depends_on: [] }, archived: false },
    runtime: { markdownReady: true, executionReady: true, ready: true, sourceDisagreement: false },
  };
  const status = {
    schemaVersion: "task-status/v1",
    id: "wi-002",
    title: "A work item",
    filePath: "backlog/002-work.md",
    status: "ready",
    lifecycle: "active",
    validation: { isActive: true, isReady: true, isAfk: true, isHitl: false, dependenciesSatisfied: true },
    runtime: { markdownReady: true, executionReady: true, ready: true, sourceDisagreement: false },
    recovery: { state: "ready", forceRequired: false, forceReasons: [], blockedReasons: [], warnings: [] },
    graph: { relationships: [], diagnostics: { projection: [], informationalReferences: [] } },
  };
  const close = { schemaVersion: "task-close/v1", id: "wi-002", status: "closed", lifecycle: "closed" };

  assert.equal(parseShowResult(show), show);
  assert.equal(parseStatusValidateResult(status), status);
  assert.equal(parseCloseResult(close), close);
  for (const [parse, malformed] of [
    [parseShowResult, { ...show, schemaVersion: "task-model/v999" }],
    [parseStatusValidateResult, { ...status, validation: { ...status.validation, isAfk: "yes" } }],
    [parseCloseResult, { ...close, status: "ready" }],
  ]) {
    assert.throws(() => parse(malformed), /structured|schema|version|invalid|close/i);
  }
});

test("keeps command argv compatibility separate from publisher-owned Work-result selection", async () => {
  const { parseRepositoryOverride, resultSchemas } = await loadContract();

  assert.equal(Object.hasOwn(resultSchemas, "ready"), false);
  for (const schema of Object.values(resultSchemas)) {
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.match(schema.$id, /\/v1\.schema\.json$/);
  }
  const override = {
    schemaVersion: "doc-vader-override/v1",
    compatibleWith: ["doc-vader-contract/v1"],
    commands: { show: ["dv", "work", "show", "{workId}", "--json"] },
  };
  assert.equal(parseRepositoryOverride(override), override);
  assert.throws(
    () => parseRepositoryOverride({ ...override, compatibleWith: ["doc-vader-contract/v999"] }),
    /compatible|version/i,
  );
  assert.throws(
    () => parseRepositoryOverride({ ...override, compatibleWith: ["doc-vader-contract/v1", 1] }),
    /compatibleWith.*string|string.*compatibleWith/i,
  );
  assert.throws(
    () => parseRepositoryOverride({ ...override, commands: { show: ["dv", "work", "show"] } }),
    /workId|command|invalid/i,
  );
});


test("keeps published status/validate and repository override schemas in parity with their parsers", async () => {
  const { resultSchemas } = await loadContract();

  assert.deepEqual(resultSchemas.statusValidate.properties.validation, {
    type: "object",
    additionalProperties: true,
    required: ["isActive", "isReady", "isAfk", "isHitl", "dependenciesSatisfied"],
    properties: {
      isActive: { type: "boolean" },
      isReady: { type: "boolean" },
      isAfk: { type: "boolean" },
      isHitl: { type: "boolean" },
      dependenciesSatisfied: { type: "boolean" },
    },
  });
  assert.deepEqual(resultSchemas.repositoryOverride.properties.compatibleWith, {
    type: "array",
    minItems: 1,
    items: { type: "string" },
    contains: { const: "doc-vader-contract/v1" },
  });
  assert.deepEqual(resultSchemas.repositoryOverride.properties.commands, {
    type: "object",
    additionalProperties: false,
    properties: {
      ready: { type: "array", minItems: 1, items: { type: "string", minLength: 1 }, contains: { const: "--json" } },
      show: { type: "array", minItems: 1, items: { type: "string", minLength: 1 }, allOf: [{ contains: { const: "--json" } }, { contains: { const: "{workId}" } }] },
      validate: { type: "array", minItems: 1, items: { type: "string", minLength: 1 }, allOf: [{ contains: { const: "--json" } }, { contains: { const: "{workId}" } }] },
      close: { type: "array", minItems: 1, items: { type: "string", minLength: 1 }, allOf: [{ contains: { const: "--json" } }, { contains: { const: "{workId}" } }] },
    },
  });
});

test("README documents the compatible optional repository override seam", async () => {
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");

  assert.match(readme, /optional repository override/i);
  assert.match(readme, /doc-vader-contract\/v1/);
  assert.match(readme, /compatibleWith/);
});
