import { assertCollection } from "../../../.agents/skills/adr-audit/scripts/lib/adr-metadata.mjs";
import { selectAuditTargets } from "../../../.agents/skills/adr-audit/scripts/lib/adr-audit-targets.mjs";

export function selectConflicts(collection, before) {
  const targetPaths = new Set(
    selectAuditTargets(before).map(({ path }) => path),
  );
  assertCollection(collection);
  if (
    collection.diagnostics.length ||
    collection.documents.some((document) => document.diagnostics.length)
  ) {
    throw new Error(
      "ADR collection is incomplete; conflict reporting was stopped.",
    );
  }
  const adrs = collection.documents.filter(
    (document) => document.rootId === "docs" && document.kind === "adr",
  );
  const conflicts = adrs.filter(
    ({ path, metadata }) =>
      targetPaths.has(path) &&
      metadata.status === "draft" &&
      metadata.audit === "conflict",
  );
  for (const conflict of conflicts) {
    const { id } = conflict.metadata;
    if (typeof id !== "string" || !id.trim()) {
      throw new Error(`Conflicting ADR has no valid ID: ${conflict.path}`);
    }
    if (adrs.filter((document) => document.metadata.id === id).length !== 1) {
      throw new Error(`Conflicting ADR has a duplicate ID: ${id}`);
    }
  }
  return conflicts;
}

export function planConflictIssues(conflicts, issues) {
  return conflicts.map((conflict) => {
    const marker = `<!-- nightly-adr-audit:${encodeURIComponent(conflict.metadata.id)} -->`;
    const issue = issues.find(
      (item) =>
        item.state === "open" &&
        !item.pull_request &&
        item.body?.includes(marker),
    );
    return { conflict, marker, issue };
  });
}
