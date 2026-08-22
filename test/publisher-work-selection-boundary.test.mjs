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

test("returns typed non-selections with opaque publisher diagnostics", async () => {
  const { decodePublisherWorkSelection } = await loadBoundary();
  const response = selected({ outcome: { kind: "not-selected", code: "PUBLISHER_DEFINED_DIAGNOSTIC" } });

  assert.deepEqual(decodePublisherWorkSelection(request(), response), {
    kind: "not-selected",
    code: "PUBLISHER_DEFINED_DIAGNOSTIC",
    capability: "publisher-work-selection/v1",
    decisionArtifact: response.decisionArtifact,
  });
});

test("fails closed for malformed transport, unsupported capability, missing evidence, and identity mismatch", async () => {
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
