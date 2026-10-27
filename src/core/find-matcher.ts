import { FIND_QUERY_LIMIT, FIND_RANGE_LIMIT, type FindCoverage, type FindQuery, type FindRecord,
  type FindScope, type MatchingRecord } from './find-protocol.ts';

/** Only the escaped query folds. Whole-word neighbors keep their original
 * Unicode categories (in particular the combining mark U+0345).
 */
function literalMatcher(query: FindQuery): RegExp {
  if (query.text.length > FIND_QUERY_LIMIT) throw new RangeError('Find query exceeds 16,384 UTF-16 units');
  let pattern = query.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!query.matchCase) pattern = `(?i:${pattern})`;
  if (query.wholeWords) pattern = `(?<![\\p{L}\\p{N}_])${pattern}(?![\\p{L}\\p{N}_])`;
  return new RegExp(pattern, 'gu');
}

/** Scope order is presentation priority. Enumerate from the original source
 * beginning, so fragment boundaries never change which overlapping hit wins.
 * Allocate only requested intersections, up to the shared reply cap.
 */
export function sourceRanges(records: readonly FindRecord[], query: FindQuery, scopes: readonly FindScope[]):
  { ranges: FindScope[]; coverage: FindCoverage[] } {
  const ranges: FindScope[] = [];
  const coverage = scopes.map(scope => ({ scope, complete: !query.text }));
  if (!query.text) return { ranges, coverage };
  const matcher = literalMatcher(query);
  const groups = new Map<string, { text: string; scopes: FindCoverage[] }>();
  for (const entry of coverage) {
    const { ref, source } = entry.scope;
    const key = JSON.stringify([ref.context, ref.occurrence, source]);
    let group = groups.get(key);
    if (!group) {
      const record = records.find(record => record.ref.context === ref.context && record.ref.occurrence === ref.occurrence);
      const text = record?.[source];
      if (text === undefined) throw new RangeError('Range scope has no original source');
      group = { text, scopes: [] };
      groups.set(key, group);
    }
    group.scopes.push(entry);
  }
  for (const group of groups.values()) {
    if (ranges.length === FIND_RANGE_LIMIT) break;
    matcher.lastIndex = 0;
    const end = Math.max(...group.scopes.map(entry => entry.scope.end));
    let overflow: number | undefined;
    for (let match; (match = matcher.exec(group.text)) && match.index < end;) {
      const start = match.index, finish = start + match[0].length;
      if (!group.scopes.some(({ scope }) => start < scope.end && finish > scope.start)) continue;
      if (ranges.length === FIND_RANGE_LIMIT) { overflow = start; break; }
      ranges.push({ ref: group.scopes[0].scope.ref, source: group.scopes[0].scope.source, start, end: finish });
    }
    for (const entry of group.scopes) entry.complete = overflow === undefined || entry.scope.end <= overflow;
  }
  return { ranges, coverage };
}

/** Complete retained order; counts/provenance are independent of decorations. */
export function matchingRecords(records: readonly FindRecord[], query: FindQuery): MatchingRecord[] {
  if (!query.text) return [];
  const matcher = literalMatcher(query);
  const hasMatch = (text: string) => { matcher.lastIndex = 0; return matcher.test(text); };
  const matches: MatchingRecord[] = [];
  for (const record of records) {
    const application = hasMatch(record.application);
    const message = record.message !== undefined && (record.message === record.application ? application : hasMatch(record.message));
    if (application || message) matches.push({ ref: record.ref, application, message });
  }
  return matches;
}
