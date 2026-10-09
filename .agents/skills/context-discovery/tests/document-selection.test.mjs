import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { resolveSelections, classify, standardDirectories } from '../scripts/lib/document-selection.mjs';
import { collectDocuments } from '../scripts/lib/collect-documents.mjs';

async function fixture(t) {
  const main = await mkdtemp(join(tmpdir(), 'skill-selection-'));
  const docs = join(main, 'docs');
  await mkdir(docs);
  for (const name of standardDirectories) await mkdir(join(docs, name));
  t.after(() => rm(main, { recursive: true, force: true }));
  return { main, docs };
}

test('classification preserves distinct metadata obligations', () => {
  for (const [root, path, kind] of [['docs', 'instructions/a.md', 'global-instruction'], ['docs', 'instructions/AGENTS.md', 'local-instruction'], ['docs', 'templates/ADR/example.md', 'template'], ['main', '.agents/skills/a/SKILL.md', 'skill'], ['main', 'apps/a/foo.DESG.md', 'local-design'], ['main', 'apps/a/read.md', 'unknown']]) assert.equal(classify(root, path), kind);
});

test('default scope excludes main, templates and generated dependencies', async (t) => {
  const { main, docs } = await fixture(t);
  await mkdir(join(docs, 'instructions/node_modules'));
  await writeFile(join(docs, 'instructions/node_modules/skip.md'), '---\nrelevant-to: hidden\n---');
  await writeFile(join(docs, 'instructions/a.md'), '# No metadata');
  await writeFile(join(main, 'main.md'), '# Main');
  const selection = await resolveSelections({ docsRoot: docs, mainRoot: main });
  const result = await collectDocuments(selection);
  assert.deepEqual(result.documents.map((item) => item.path), ['instructions/a.md']);
  assert.deepEqual(result.diagnostics, []);
});

test('explicit selections narrow collection, deduplicate and follow published skill links', async (t) => {
  const { main, docs } = await fixture(t);
  await mkdir(join(docs, '.agents/skills/example'), { recursive: true });
  await mkdir(join(main, '.agents/skills'), { recursive: true });
  await writeFile(join(docs, '.agents/skills/example/SKILL.md'), '---\nname: example\ndescription: Example\n---');
  await symlink('../../docs/.agents/skills/example', join(main, '.agents/skills/example'));
  await writeFile(join(docs, 'instructions/other.md'), '# Not selected');
  const selection = await resolveSelections({ docsRoot: docs, mainRoot: main, paths: ['main:.agents/skills/example', 'docs:.agents/skills/example/SKILL.md'] });
  const result = await collectDocuments(selection);
  assert.equal(result.documents.length, 1);
  assert.equal(result.documents[0].rootId, 'docs');
  assert.equal(result.documents[0].kind, 'skill');
});

test('undefined roots, escaping paths and outside links are rejected', async (t) => {
  const { main, docs } = await fixture(t);
  await symlink(main, join(docs, 'outside'));
  for (const paths of [['main:a.md'], ['docs:../../outside'], ['docs:/etc'], ['docs:missing'], ['docs:outside']]) {
    await assert.rejects(resolveSelections({ docsRoot: docs, paths }));
  }
});

test('parse and enumeration failures report incomplete scanning without losing candidates', async (t) => {
  const { docs } = await fixture(t);
  await writeFile(join(docs, 'instructions/bad.md'), '---\nmissing closing block');
  const result = await collectDocuments({ roots: { docs }, selections: [{ path: join(docs, 'instructions'), explicit: false }, { path: join(docs, 'not-available'), explicit: false }] });
  assert.equal(result.documents[0].path, 'instructions/bad.md');
  assert.equal(result.documents[0].diagnostics[0].code, 'frontmatter-invalid');
  assert.ok(result.diagnostics.some((item) => item.code === 'directory-unreadable'));
  assert.ok(result.diagnostics.some((item) => item.code === 'scanning-incomplete'));
});
