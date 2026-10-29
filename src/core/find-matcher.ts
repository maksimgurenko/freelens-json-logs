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
  let remainingGroups = groups.size;
  for (const group of groups.values()) {
    // Early dense presentations must not consume every later visible source's
    // slots. Unused shares flow forward in caller priority order.
    const limit = ranges.length + Math.ceil((FIND_RANGE_LIMIT - ranges.length) / remainingGroups--);
    matcher.lastIndex = 0;
    const end = Math.max(...group.scopes.map(entry => entry.scope.end));
    let overflow: number | undefined;
    for (let match; (match = matcher.exec(group.text)) && match.index < end;) {
      const start = match.index, finish = start + match[0].length;
      if (!group.scopes.some(({ scope }) => start < scope.end && finish > scope.start)) continue;
      if (ranges.length === limit) { overflow = start; break; }
      ranges.push({ ref: group.scopes[0].scope.ref, source: group.scopes[0].scope.source, start, end: finish });
    }
    for (const entry of group.scopes) entry.complete = overflow === undefined || entry.scope.end <= overflow;
  }
  return { ranges, coverage };
}

/** Complete retained order; counts/provenance are independent of decorations. */
export function matchingRecords(records: readonly FindRecord[], query: FindQuery): MatchingRecord[] {
  return new FindRecordMatcher().match(records, query);
}

/** One worker's latest window only. Reuse each source's membership through
 * observed occurrence overlap; changed queries/text and evictions invalidate it.
 * No full text-match index is built for snapshot maintenance.
 */
export class FindRecordMatcher {
  private query?: FindQuery;
  private retained = new Map<string, { record: FindRecord; application: boolean; message: boolean }>();
  match(records: readonly FindRecord[], query: FindQuery): MatchingRecord[] {
    if (this.query?.text !== query.text || this.query.matchCase !== query.matchCase || this.query.wholeWords !== query.wholeWords)
      this.retained.clear();
    this.query = { ...query };
    if (!query.text) { this.retained.clear(); return []; }
    const matcher = literalMatcher(query);
    const hasMatch = (text: string) => { matcher.lastIndex = 0; return matcher.test(text); };
    const next: typeof this.retained = new Map(), matches: MatchingRecord[] = [];
    for (const record of records) {
      const key = JSON.stringify(record.ref), previous = this.retained.get(key);
      const application = previous?.record.application === record.application ? previous.application : hasMatch(record.application);
      const message = record.message !== undefined && (record.message === record.application ? application
        : previous?.record.message === record.message ? previous.message : hasMatch(record.message));
      next.set(key, { record, application, message });
      if (application || message) matches.push({ ref: record.ref, application, message });
    }
    this.retained = next;
    return matches;
  }
}
