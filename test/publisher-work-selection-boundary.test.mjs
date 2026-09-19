import assert from "node:assert/strict";
import test from "node:test";

const loadBoundary = () => import("../src/publisher-work-selection.js");

const request = (overrides = {}) => ({
  capability: "publisher-work-selection/v1",
  request: { workItemId: "wi-001", invocationContext: { caller: "blueprint" } },
  ...overrides,
});

const selected = (overrides = {}) => ({
  capability: "publisher-work-selection/v1",
  outcome: { kind: "selected", workItemId: "wi-001" },
  decisionArtifact: { command: ["dv", "work", "ready", "--json"], result: { schemaVersion: "task-ready/v1", candidates: [{ id: "wi-001" }] } },
  ...overrides,
});

test("accepts only an explicit publisher-selected requested identity without decoding its opaque artifact", async () => {
  const { decodePublisherWorkSelection } = await loadBoundary();
  const response = selected();

  assert.deepEqual(decodePublisherWorkSelection(request(), response), {
    kind: "selected",
    workItemId: "wi-001",
    capability: "publisher-work-selection/v1",
    decisionArtifact: response.decisionArtifact,
  });
});

test("returns typed non-selections with opaque publisher diagnostics and preserves all evidence", async () => {
  const { decodePublisherWorkSelection } = await loadBoundary();
  const response = selected({
    outcome: { kind: "not-selected", code: "PUBLISHER_DEFINED_DIAGNOSTIC" },
    decisionArtifact: { command: ["publisher", "select"], artifact: { opaqueReceipt: true } },
  });

  assert.deepEqual(decodePublisherWorkSelection(request(), response), {
    kind: "not-selected",
    code: "PUBLISHER_DEFINED_DIAGNOSTIC",
    capability: "publisher-work-selection/v1",
    decisionArtifact: response.decisionArtifact,
  });
});

test("requires non-empty opaque command and result or artifact transport fields without decoding them", async () => {
  const { decodePublisherWorkSelection } = await loadBoundary();
  const opaqueResult = { publisherDefined: { nested: "value" } };
  const response = selected({ decisionArtifact: { command: ["arbitrary", 42], result: opaqueResult } });

  assert.strictEqual(decodePublisherWorkSelection(request(), response).decisionArtifact.result, opaqueResult);
  for (const decisionArtifact of [
    {},
    { command: [], result: opaqueResult },
    { command: ["publisher"] },
    { command: ["publisher"], result: {} },
    { command: ["publisher"], artifact: {} },
    { command: "publisher", result: opaqueResult },
    { command: ["publisher"], result: null },
  ]) {
    assert.throws(
      () => decodePublisherWorkSelection(request(), selected({ decisionArtifact })),
      /command|result|artifact|evidence|selection/i,
    );
  }
});

test("fails closed for malformed transport, unsupported capability, and identity mismatch", async () => {
  const { decodePublisherWorkSelection } = await loadBoundary();
  for (const response of [
    undefined,
    selected({ capability: "publisher-work-selection/v2" }),
    { ...selected(), decisionArtifact: undefined },
    selected({ outcome: { kind: "selected", workItemId: "wi-002" } }),
    selected({ outcome: { kind: "not-selected" } }),
  ]) {
    assert.throws(() => decodePublisherWorkSelection(request(), response), /publisher|selection|capability|artifact|identity|outcome/i);
  }
});
