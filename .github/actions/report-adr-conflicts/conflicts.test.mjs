import assert from "node:assert/strict";
import test from "node:test";
import { planConflictIssues, selectConflicts } from "./conflicts.mjs";

const adr = (
  id,
  status = "draft",
  audit = "conflict",
  path = `ADR/${id}.md`,
) => ({
  rootId: "docs",
  path,
  kind: "adr",
  metadata: { id, status, audit },
  diagnostics: [],
});
const collection = (...documents) => ({
  schemaVersion: 1,
  documents,
  diagnostics: [],
});

test("only conflicting draft ADRs are reported, including unchanged conflicts", () => {
  const conflict = adr("conflict");
  assert.deepEqual(
    selectConflicts(
      collection(
        conflict,
        adr("pending", "draft", "pending"),
        adr("accepted", "accepted", "conflict"),
        adr("passed", "draft", "passed"),
        { ...adr("other"), kind: "local-document" },
        { ...adr("main"), rootId: "main" },
      ),
    ),
    [conflict],
  );
  assert.deepEqual(selectConflicts(collection()), []);
});

test("incomplete collection is not reported as no conflicts", () => {
  assert.throws(
    () =>
      selectConflicts({
        ...collection(),
        diagnostics: [{ code: "scanning-incomplete", message: "Read failed" }],
      }),
    /incomplete/,
  );
  assert.throws(
    () =>
      selectConflicts(
        collection({
          ...adr("broken"),
          diagnostics: [
            { code: "document-unreadable", message: "Read failed" },
          ],
        }),
      ),
    /incomplete/,
  );
  assert.throws(() => selectConflicts({ schemaVersion: 2 }), /schemaVersion/);
});

test("missing and duplicate conflict identities stop issue creation", () => {
  for (const id of [undefined, "", " "]) {
    assert.throws(() => selectConflicts(collection(adr(id))), /no valid ID/);
  }
  assert.throws(
    () =>
      selectConflicts(
        collection(
          adr("duplicate"),
          adr("duplicate", "accepted", "passed", "ADR/other.md"),
        ),
      ),
    /duplicate ID/,
  );
});

test("open issues are matched by stable ADR ID even after a path rename", () => {
  const conflict = adr("stable", "draft", "conflict", "ADR/renamed.md");
  const issue = {
    state: "open",
    body: "<!-- nightly-adr-audit:stable -->",
    number: 1,
  };
  assert.equal(planConflictIssues([conflict], [issue])[0].issue, issue);
});

test("closed issues, pull requests and unmarked titles do not suppress new issues", () => {
  const conflict = adr("conflict");
  const body = "<!-- nightly-adr-audit:conflict -->";
  const issues = [
    { state: "closed", body },
    { state: "open", body, pull_request: {} },
    { state: "open", title: "ADR競合: ADR/conflict.md", body: null },
    { state: "open", body: "<!-- nightly-adr-audit:other -->" },
  ];
  assert.equal(planConflictIssues([conflict], issues)[0].issue, undefined);
});

test("identity markers safely encode comment delimiters and separate ADRs", () => {
  const plans = planConflictIssues([adr("id --> 日本語"), adr("other")], []);
  assert.equal(
    plans[0].marker,
    "<!-- nightly-adr-audit:id%20--%3E%20%E6%97%A5%E6%9C%AC%E8%AA%9E -->",
  );
  assert.notEqual(plans[0].marker, plans[1].marker);
});
