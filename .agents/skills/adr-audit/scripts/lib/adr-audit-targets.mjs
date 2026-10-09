import { assertCollection } from "./adr-metadata.mjs";

export function selectAuditTargets(collection) {
  assertCollection(collection);
  if (
    collection.diagnostics.length ||
    collection.documents.some((document) => document.diagnostics.length)
  ) {
    throw new Error(
      "ADR collection is incomplete; audit target selection was stopped.",
    );
  }
  return collection.documents.filter(
    ({ rootId, kind, metadata }) =>
      rootId === "docs" &&
      kind === "adr" &&
      metadata.status === "draft" &&
      metadata.audit === "pending",
  );
}
