import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const loadContract = () => import("../src/doc-vader-contract.mjs");

test("keeps command argv compatibility separate from publisher-owned Work results", async () => {
  const contract = await loadContract();
  const { builtInCommands, parseRepositoryOverride } = contract;

  assert.deepEqual(builtInCommands.ready(), ["dv", "work", "ready", "--json"]);
  assert.deepEqual(builtInCommands.show("wi-002"), ["dv", "work", "show", "wi-002", "--json"]);
  assert.deepEqual(builtInCommands.validate("wi-002"), ["dv", "work", "status", "wi-002", "--validate", "--json"]);
  assert.deepEqual(builtInCommands.close("wi-002"), ["dv", "work", "close", "wi-002", "--json"]);

  for (const name of ["resultSchemas", "parseShowResult", "parseStatusValidateResult", "parseCloseResult"]) {
    assert.equal(Object.hasOwn(contract, name), false, name);
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

test("README documents the publisher-owned result boundary and optional argv-only override seam", async () => {
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");

  assert.match(readme, /publisher-owned/i);
  assert.match(readme, /optional repository override/i);
  assert.match(readme, /command argv/i);
  assert.doesNotMatch(readme, /semantically validates/i);
});
