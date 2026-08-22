export const PUBLISHER_WORK_SELECTION_CAPABILITY = "publisher-work-selection/v1";

function invalid(message) {
  throw new TypeError(`Invalid publisher work selection: ${message}`);
}

function record(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid(`${label} must be an object`);
  return value;
}

function selectionEvidence(value) {
  const evidence = record(value, "publisher decision artifact");
  if (!Array.isArray(evidence.command) || evidence.command.length === 0) {
    invalid("publisher decision command must be a non-empty opaque array");
  }
  if (![evidence.result, evidence.artifact].some(isNonEmptyOpaqueEvidence)) {
    invalid("publisher decision result or artifact must be non-empty opaque evidence");
  }
  return evidence;
}

function isNonEmptyOpaqueEvidence(value) {
  return value && typeof value === "object" && !Array.isArray(value) && Reflect.ownKeys(value).length > 0;
}

/**
 * Check only the stable publisher-selection transport. Work-result schemas,
 * readiness semantics, and diagnostic-code meanings remain publisher-owned.
 */
export function decodePublisherWorkSelection(request, response) {
  const selectionRequest = record(request, "request");
  if (selectionRequest.capability !== PUBLISHER_WORK_SELECTION_CAPABILITY) invalid("unsupported requested capability");
  const requested = record(selectionRequest.request, "request.request");
  if (typeof requested.workItemId !== "string" || requested.workItemId === "") invalid("request work identity is required");
  if (!Object.hasOwn(requested, "invocationContext")) invalid("request invocation context is required");

  const publisherResponse = record(response, "response");
  if (publisherResponse.capability !== PUBLISHER_WORK_SELECTION_CAPABILITY) invalid("unsupported publisher capability or version");
  const decisionArtifact = selectionEvidence(publisherResponse.decisionArtifact);
  const outcome = record(publisherResponse.outcome, "publisher outcome");

  if (outcome.kind === "selected") {
    if (typeof outcome.workItemId !== "string" || outcome.workItemId === "") invalid("selected work identity is required");
    if (outcome.workItemId !== requested.workItemId) invalid("publisher selected a different work identity");
    return Object.freeze({
      kind: "selected",
      workItemId: outcome.workItemId,
      capability: publisherResponse.capability,
      decisionArtifact,
    });
  }
  if (outcome.kind === "not-selected" && typeof outcome.code === "string" && outcome.code !== "") {
    return Object.freeze({
      kind: "not-selected",
      code: outcome.code,
      capability: publisherResponse.capability,
      decisionArtifact,
    });
  }
  invalid("publisher outcome is malformed");
}
