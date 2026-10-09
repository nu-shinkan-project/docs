export function assertCollection(value) {
  const record = (item) =>
    item !== null && typeof item === "object" && !Array.isArray(item);
  const diagnostics = (items) =>
    Array.isArray(items) &&
    items.every(
      (item) =>
        record(item) &&
        typeof item.code === "string" &&
        typeof item.message === "string",
    );
  if (
    !record(value) ||
    value.schemaVersion !== 1 ||
    !Array.isArray(value.documents) ||
    !diagnostics(value.diagnostics)
  )
    throw new Error("Expected a schemaVersion=1 document collection.");
  for (const document of value.documents) {
    if (
      !record(document) ||
      !["docs", "main"].includes(document.rootId) ||
      typeof document.path !== "string" ||
      !document.path ||
      typeof document.kind !== "string" ||
      !record(document.metadata) ||
      !diagnostics(document.diagnostics)
    )
      throw new Error("Invalid document entry in collection.");
  }
}

function finish(issues, unassessed) {
  const outcome = unassessed.length
    ? "incomplete"
    : issues.some((issue) => issue.severity === "error")
      ? "failed"
      : "passed";
  return { schemaVersion: 1, outcome, issues, unassessed };
}

function collectionFailures(collection, unassessed) {
  for (const diagnostic of collection.diagnostics)
    unassessed.push({ ...diagnostic });
  for (const document of collection.documents) {
    for (const diagnostic of document.diagnostics)
      unassessed.push({
        rootId: document.rootId,
        path: document.path,
        ...diagnostic,
      });
  }
}

export function checkAdrMetadata(collection) {
  assertCollection(collection);
  const issues = [];
  const unassessed = [];
  collectionFailures(collection, unassessed);
  const documents = collection.documents.filter(
    (document) => document.kind === "adr" && !document.diagnostics.length,
  );
  const ids = new Map();
  const edges = new Map();
  const issue = (
    document,
    code,
    field,
    message,
    severity = "error",
    relatedPaths,
  ) =>
    issues.push({
      code,
      severity,
      rootId: document.rootId,
      path: document.path,
      field,
      message,
      source: "policy/documentation.md",
      ...(relatedPaths ? { relatedPaths } : {}),
    });
  for (const document of documents) {
    const { metadata } = document;
    if (typeof metadata.id === "string" && metadata.id.trim()) {
      const group = ids.get(metadata.id) ?? [];
      group.push(document);
      ids.set(metadata.id, group);
    } else
      unassessed.push({
        rootId: document.rootId,
        path: document.path,
        code: "adr-identity-unavailable",
        message:
          "ID-dependent checks require a valid id; use docs-audit to check basic metadata.",
      });
    for (const [field, choices] of [
      ["status", ["draft", "accepted", "rejected", "superseded"]],
      ["audit", ["pending", "passed", "conflict"]],
    ]) {
      if (!Object.hasOwn(metadata, field))
        issue(
          document,
          "adr-state-unspecified",
          field,
          "State cannot be determined from this metadata.",
          "warning",
        );
      else if (!choices.includes(metadata[field]))
        issue(
          document,
          "invalid-adr-state",
          field,
          `Expected one of: ${choices.join(", ")}.`,
        );
    }
    if (
      Object.hasOwn(metadata, "supersedes") &&
      !(
        Array.isArray(metadata.supersedes) &&
        metadata.supersedes.every((id) => typeof id === "string")
      )
    )
      issue(
        document,
        "invalid-supersedes",
        "supersedes",
        "Expected a list of ADR IDs.",
      );
  }
  for (const [id, group] of ids) {
    if (group.length > 1) {
      for (const document of group)
        issue(
          document,
          "duplicate-adr-id",
          "id",
          `Identifier ${id} occurs more than once in the input.`,
          "error",
          group.map((item) => ({ rootId: item.rootId, path: item.path })),
        );
    }
    const references = new Set();
    for (const document of group) {
      const supersedes = document.metadata.supersedes;
      if (!Array.isArray(supersedes)) continue;
      for (const target of supersedes) {
        if (typeof target !== "string") continue;
        if (!ids.has(target))
          issue(
            document,
            "referenced-adr-not-in-input",
            "supersedes",
            `Referenced ID ${target} is not in this input; check the document separately.`,
            "warning",
          );
        else references.add(target);
        if (target === id)
          issue(
            document,
            "adr-self-reference",
            "supersedes",
            "The ADR refers to itself; inspect the intended replacement.",
            "warning",
          );
      }
    }
    edges.set(id, references);
  }
  const active = new Set();
  const done = new Set();
  function visit(id, trail) {
    if (active.has(id)) {
      const cycle = [...trail.slice(trail.indexOf(id)), id];
      issue(
        ids.get(id)[0],
        "adr-replacement-cycle",
        "supersedes",
        `Inspect the replacement cycle: ${cycle.join(" -> ")}`,
        "warning",
      );
      return;
    }
    if (done.has(id)) return;
    active.add(id);
    for (const target of edges.get(id) ?? []) visit(target, [...trail, id]);
    active.delete(id);
    done.add(id);
  }
  for (const id of ids.keys()) visit(id, []);
  return finish(issues, unassessed);
}
