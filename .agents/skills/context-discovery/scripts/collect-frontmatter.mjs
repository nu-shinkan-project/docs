import { parseArgs } from 'node:util';
import { resolveSelections } from './lib/document-selection.mjs';
import { collectDocuments } from './lib/collect-documents.mjs';

try {
  const { values } = parseArgs({ options: { 'docs-root': { type: 'string' }, 'main-root': { type: 'string' }, path: { type: 'string', multiple: true } } });
  const selection = await resolveSelections({ docsRoot: values['docs-root'], mainRoot: values['main-root'], paths: values.path });
  const result = await collectDocuments(selection);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.diagnostics.some((diagnostic) => diagnostic.code === 'scanning-incomplete') ? 1 : 0;
} catch (error) {
  console.log(JSON.stringify({ schemaVersion: 1, documents: [], diagnostics: [{ code: 'scanning-incomplete', message: error.message }] }, null, 2));
  console.error(error.message);
  process.exitCode = 2;
}
