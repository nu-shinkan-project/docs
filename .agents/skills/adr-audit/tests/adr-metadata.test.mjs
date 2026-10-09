import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkAdrMetadata } from '../scripts/lib/adr-metadata.mjs';
const adr = (id, extra = {}, path = `${id}.md`) => ({ rootId: 'docs', path: `ADR/${path}`, kind: 'adr', metadata: { id, status: 'accepted', audit: 'passed', ...extra }, diagnostics: [] });
const collection = (...documents) => ({ schemaVersion: 1, documents, diagnostics: [] });

test('states and replacement metadata follow existing vocabulary', () => {
  assert.equal(checkAdrMetadata(collection(adr('a', { status: 'draft', audit: 'pending' }))).outcome, 'passed');
  for (const extra of [{ status: 'approved' }, { audit: 'good' }, { supersedes: 'a' }, { supersedes: [1] }]) assert.equal(checkAdrMetadata(collection(adr('a', extra))).outcome, 'failed');
  const unspecified = adr('a');
  delete unspecified.metadata.status;
  delete unspecified.metadata.audit;
  const result = checkAdrMetadata(collection(unspecified));
  assert.equal(result.outcome, 'passed');
  assert.equal(result.issues.length, 2);
});

test('duplicate identifiers are found within input and all paths are reported', () => {
  const result = checkAdrMetadata(collection(adr('a', {}, 'first.md'), adr('a', {}, 'second.md')));
  assert.equal(result.outcome, 'failed');
  assert.equal(result.issues.filter((issue) => issue.code === 'duplicate-adr-id').length, 2);
  assert.equal(result.issues[0].relatedPaths.length, 2);
});

test('references outside input warn without implying nonexistence or incomplete scanning', () => {
  const result = checkAdrMetadata(collection(adr('a', { supersedes: ['outside'] })));
  assert.equal(result.outcome, 'passed');
  assert.equal(result.issues[0].code, 'referenced-adr-not-in-input');
  assert.equal(result.issues[0].severity, 'warning');
});

test('replacement cycles and self references are reported without adding policy prohibitions', () => {
  const result = checkAdrMetadata(collection(adr('a', { supersedes: ['b'] }), adr('b', { supersedes: ['a'] }), adr('c', { supersedes: ['c'] })));
  assert.equal(result.outcome, 'passed');
  assert.equal(result.issues.filter((issue) => issue.code === 'adr-replacement-cycle').length, 2);
  assert.ok(result.issues.some((issue) => issue.code === 'adr-self-reference'));
});

test('missing identities and collection failures leave applicable checks unassessed', () => {
  const input = collection(adr('a', { id: null }));
  input.diagnostics.push({ code: 'scanning-incomplete', message: 'Some files failed' });
  assert.equal(checkAdrMetadata(input).outcome, 'incomplete');
  assert.throws(() => checkAdrMetadata({ ...input, schemaVersion: 2 }));
});
