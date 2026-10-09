export function assertCollection(value) {
  const record = (item) => item !== null && typeof item === 'object' && !Array.isArray(item);
  const diagnostics = (items) => Array.isArray(items) && items.every((item) => record(item) && typeof item.code === 'string' && typeof item.message === 'string');
  if (!record(value) || value.schemaVersion !== 1 || !Array.isArray(value.documents) || !diagnostics(value.diagnostics)) throw new Error('Expected a schemaVersion=1 document collection.');
  for (const document of value.documents) {
    if (!record(document) || !['docs', 'main'].includes(document.rootId) || typeof document.path !== 'string' || !document.path || typeof document.kind !== 'string' || !record(document.metadata) || !diagnostics(document.diagnostics)) throw new Error('Invalid document entry in collection.');
  }
}

function finish(issues, unassessed) {
  const outcome = unassessed.length ? 'incomplete' : issues.some((issue) => issue.severity === 'error') ? 'failed' : 'passed';
  return { schemaVersion: 1, outcome, issues, unassessed };
}

function collectionFailures(collection, unassessed) {
  for (const diagnostic of collection.diagnostics) unassessed.push({ ...diagnostic });
  for (const document of collection.documents) {
    for (const diagnostic of document.diagnostics) unassessed.push({ rootId: document.rootId, path: document.path, ...diagnostic });
  }
}

function validCreatedAt(value) {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const zone = match[7];
  const midnight = hour === 24 && minute === 0 && second === 0 && !/\.[0-9]*[1-9]/.test(value);
  return month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1]
    && (hour < 24 || midnight) && minute < 60 && second <= 60
    && (zone === 'Z' || (Number(zone.slice(1, 3)) < 24 && Number(zone.slice(4)) < 60));
}

export function checkDocumentMetadata(collection) {
  assertCollection(collection);
  const issues = [];
  const unassessed = [];
  collectionFailures(collection, unassessed);
  for (const document of collection.documents) {
    if (document.diagnostics.length) continue;
    const { kind, metadata } = document;
    const issue = (code, field, message, severity = 'error') => issues.push({ code, severity, rootId: document.rootId, path: document.path, ...(field ? { field } : {}), message, source: kind === 'skill' ? 'SKILL.md standard metadata' : 'policy/documentation.md' });
    if (['adr', 'global-instruction', 'snippet', 'lesson'].includes(kind)) {
      const relevant = metadata['relevant-to'];
      if (!Object.hasOwn(metadata, 'relevant-to')) issue('required-field-missing', 'relevant-to', 'relevant-to is required for this document kind.');
      else if (!(typeof relevant === 'string' || (Array.isArray(relevant) && relevant.every((item) => typeof item === 'string')))) issue('invalid-field-type', 'relevant-to', 'Expected a string or a list of strings.');
      else if ((typeof relevant === 'string' && !relevant.trim()) || (Array.isArray(relevant) && (!relevant.length || relevant.every((item) => !item.trim())))) issue('empty-discovery-metadata', 'relevant-to', 'No discovery information is provided.', 'warning');
    }
    if (kind === 'adr') {
      if (typeof metadata.id !== 'string' || !metadata.id.trim()) issue('invalid-adr-id', 'id', 'Expected a nonempty stable identifier; no naming format is enforced.');
      if (!validCreatedAt(metadata['created-at'])) issue('invalid-created-at', 'created-at', 'Expected a calendar-valid ISO 8601 timestamp with a timezone.');
    } else if (kind === 'skill') {
      for (const field of ['name', 'description']) {
        if (typeof metadata[field] !== 'string' || !metadata[field].trim()) issue('invalid-skill-field', field, 'Expected a nonempty string.');
      }
    } else if (['template', 'unknown'].includes(kind)) {
      issue('metadata-check-skipped', null, `No generic metadata requirements are applied to ${kind}.`, 'warning');
    }
  }
  return finish(issues, unassessed);
}
