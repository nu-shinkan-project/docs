import { test } from "node:test";
import assert from "node:assert/strict";
import { extractFrontmatter } from "../scripts/lib/frontmatter.mjs";

test("missing and empty metadata have one representation", () => {
  for (const source of [
    "# Body",
    "---\n---\nBody",
    "---\n# comment\n---",
    "# Body\n---\nid: later\n---",
    "```yaml\n---\nid: example\n---\n```",
  ]) {
    assert.deepEqual(extractFrontmatter(source), {
      metadata: {},
      diagnostics: [],
    });
  }
});

test("only the initial block supplies metadata, including BOM and CRLF", () => {
  const result = extractFrontmatter(
    "\uFEFF---\r\nrelevant-to:\r\n  - CLI\r\ncreated-at: 2026-10-09T00:00:00Z\r\n---\r\n---\r\nid: body",
  );
  assert.deepEqual(result.metadata, {
    "relevant-to": ["CLI"],
    "created-at": "2026-10-09T00:00:00Z",
  });
  assert.deepEqual(result.diagnostics, []);
});

test("unusable blocks remain candidates with a parse diagnostic", () => {
  for (const source of [
    "---\nid: unfinished",
    "---\n- list\n---",
    "---\nnull\n---",
    "---\nid: first\nid: second\n---",
    "---\nx: [\n---",
    "---\nx: .inf\n---",
    "---\nx: &a [*a]\n---",
  ]) {
    const result = extractFrontmatter(source);
    assert.deepEqual(result.metadata, {});
    assert.equal(result.diagnostics[0].code, "frontmatter-invalid");
  }
});
