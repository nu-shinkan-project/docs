import { parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';
import { checkDocumentMetadata } from './lib/document-metadata.mjs';

try {
  const { values } = parseArgs({ options: { input: { type: 'string' } } });
  if (!values.input) throw new Error('--input is required (a file path or - for stdin).');
  let source;
  if (values.input === '-') {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    source = Buffer.concat(chunks).toString('utf8');
  } else source = await readFile(values.input, 'utf8');
  const result = checkDocumentMetadata(JSON.parse(source));

  console.log(JSON.stringify(result, null, 2));
  process.exitCode = { passed: 0, failed: 1, incomplete: 2 }[result.outcome];
} catch (error) {
  console.log(JSON.stringify({ schemaVersion: 1, outcome: 'incomplete', issues: [], unassessed: [{ code: 'invalid-input', message: error.message }] }, null, 2));
  console.error(error.message);
  process.exitCode = 2;
}
