import assert from "node:assert/strict";
import test from "node:test";
import { selectAuditTargets } from "./targets.mjs";

const adr = (id, status, audit) => ({
  rootId: "docs",
  kind: "adr",
  path: `ADR/${id}.md`,
  metadata: { id, status, audit },
  diagnostics: [],
});
const collection = (...documents) => ({
  schemaVersion: 1,
  documents,
  diagnostics: [],
});

test("only pending draft ADRs are selected", () => {
  const target = adr("target", "draft", "pending");
  assert.deepEqual(
    selectAuditTargets(
      collection(
        target,
        adr("conflict", "draft", "conflict"),
        adr("passed", "draft", "passed"),
        adr("accepted", "accepted", "pending"),
        adr("rejected", "rejected", "pending"),
        adr("superseded", "superseded", "pending"),
        adr("missing-audit", "draft", undefined),
        adr("missing-status", undefined, "pending"),
        { ...adr("main", "draft", "pending"), rootId: "main" },
        { ...adr("other", "draft", "pending"), kind: "local-document" },
      ),
    ),
    [target],
  );
});

test("an empty collection or only existing conflicts produces no targets", () => {
  assert.deepEqual(selectAuditTargets(collection()), []);
  assert.deepEqual(
    selectAuditTargets(collection(adr("conflict", "draft", "conflict"))),
    [],
  );
});

test("incomplete metadata is not treated as an empty target list", () => {
  assert.throws(
    () =>
      selectAuditTargets({
        ...collection(),
        diagnostics: [{ code: "scanning-incomplete", message: "Read failed" }],
      }),
    /incomplete/,
  );
  assert.throws(
    () =>
      selectAuditTargets(
        collection({
          ...adr("broken", "draft", "pending"),
          diagnostics: [
            { code: "document-unreadable", message: "Read failed" },
          ],
        }),
      ),
    /incomplete/,
  );
});
