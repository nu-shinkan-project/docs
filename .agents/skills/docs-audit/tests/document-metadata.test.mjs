import { test } from "node:test";
import assert from "node:assert/strict";
import { checkDocumentMetadata } from "../scripts/lib/document-metadata.mjs";
const document = (kind, metadata = {}, diagnostics = []) => ({
  rootId: "docs",
  path: `${kind}/example.md`,
  kind,
  metadata,
  diagnostics,
});
const collection = (...documents) => ({
  schemaVersion: 1,
  documents,
  diagnostics: [],
});

test("required discovery metadata depends on document kind", () => {
  for (const kind of ["global-instruction", "snippet", "lesson"])
    assert.equal(
      checkDocumentMetadata(collection(document(kind))).outcome,
      "failed",
    );
  for (const kind of [
    "policy",
    "design",
    "explanation",
    "local-instruction",
    "local-design",
    "unknown",
    "template",
  ])
    assert.equal(
      checkDocumentMetadata(collection(document(kind))).outcome,
      "passed",
    );
  assert.equal(
    checkDocumentMetadata(
      collection(
        document("skill", { name: "example", description: "Example" }),
      ),
    ).outcome,
    "passed",
  );
});

test("relevant-to accepts strings and string lists without narrowing allowed empty values", () => {
  for (const relevant of ["CLI", ["CLI", "Docs"], "", []])
    assert.equal(
      checkDocumentMetadata(
        collection(document("snippet", { "relevant-to": relevant })),
      ).outcome,
      "passed",
    );
  for (const relevant of [null, 7, ["CLI", 7], { task: "CLI" }])
    assert.equal(
      checkDocumentMetadata(
        collection(document("snippet", { "relevant-to": relevant })),
      ).outcome,
      "failed",
    );
});

test("ADR metadata validates actual dates and timezones without enforcing a new ID format", () => {
  const metadata = {
    id: "historical-id",
    "created-at": "2024-02-29T00:00:00+09:00",
    "relevant-to": "CLI",
  };
  assert.equal(
    checkDocumentMetadata(collection(document("adr", metadata))).outcome,
    "passed",
  );
  for (const date of [
    "2023-02-29T00:00:00Z",
    "2024-04-31T00:00:00Z",
    "2024-02-29",
    "2024-02-29T00:00:00",
    "2024-02-29T25:00:00Z",
    "2024-02-29T00:00:00+25:00",
  ])
    assert.equal(
      checkDocumentMetadata(
        collection(document("adr", { ...metadata, "created-at": date })),
      ).outcome,
      "failed",
    );
});

test("failed extraction is unassessed, not a missing metadata violation", () => {
  const input = collection(
    document("snippet", {}, [
      { code: "frontmatter-invalid", message: "Unclosed block" },
    ]),
    document("lesson"),
  );
  input.diagnostics.push({
    code: "scanning-incomplete",
    message: "One file failed",
  });
  const result = checkDocumentMetadata(input);
  assert.equal(result.outcome, "incomplete");
  assert.equal(result.issues.length, 1);
  assert.equal(result.issues[0].path, "lesson/example.md");
  assert.equal(result.unassessed.length, 2);
});

test("unsupported versions and malformed records are input errors", () => {
  for (const value of [
    null,
    { ...collection(), schemaVersion: 2 },
    { ...collection(), documents: [document("adr", null)] },
    { ...collection(), diagnostics: [{}] },
  ])
    assert.throws(() => checkDocumentMetadata(value));
});
