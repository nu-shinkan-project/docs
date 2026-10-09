import { isMap, parseDocument } from 'yaml';

function assertJsonValue(value, ancestors = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number' && Number.isFinite(value)) return;
  if (typeof value !== 'object' || ancestors.has(value)) throw new Error('Metadata must be JSON-compatible.');
  ancestors.add(value);
  for (const child of Object.values(value)) assertJsonValue(child, ancestors);
  ancestors.delete(value);
}

export function extractFrontmatter(source) {
  const lines = source.replace(/^\uFEFF/, '').split(/\r?\n/);
  if (lines[0] !== '---') return { metadata: {}, diagnostics: [] };
  try {
    const end = lines.findIndex((line, index) => index > 0 && line === '---');
    if (end < 0) throw new Error('Front matter has no closing delimiter.');
    const parsed = parseDocument(lines.slice(1, end).join('\n'), { version: '1.2', uniqueKeys: true });
    if (parsed.errors.length) throw new Error(parsed.errors.map((error) => error.message).join('\n'));
    if (parsed.contents !== null && !isMap(parsed.contents)) throw new Error('Front matter must be a mapping.');
    const metadata = parsed.contents === null ? {} : parsed.toJSON();
    assertJsonValue(metadata);
    return { metadata, diagnostics: [] };
  } catch (error) {
    return { metadata: {}, diagnostics: [{ code: 'frontmatter-invalid', message: error.message }] };
  }
}
