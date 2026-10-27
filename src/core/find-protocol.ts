import type { RecordRef } from './occurrences.ts';

export const FIND_QUERY_LIMIT = 16_384;
export const FIND_RANGE_LIMIT = 4_096;
export const FIND_SCOPE_LIMIT = FIND_RANGE_LIMIT;
export const FIND_SOURCE_LIMIT = 5 * 1024 * 1024;
export const FIND_PENDING_MS = 100;
export const FIND_TIMEOUT_MS = 1_000;

export interface FindKey {
  viewerEpoch: number;
  targetEpoch: number;
  instanceEpoch: number;
  windowRevision: number;
  messageRevision: number;
  queryRevision: number;
}
export interface FindQuery { text: string; matchCase: boolean; wholeWords: boolean }
export type FindSource = 'application' | 'message';
export interface FindRecord { ref: RecordRef; application: string; message?: string }
export interface FindScope { ref: RecordRef; source: FindSource; start: number; end: number }
export interface FindCoverage { scope: FindScope; complete: boolean }
export interface MatchingRecord { ref: RecordRef; application: boolean; message: boolean }
export interface FindRequest {
  requestId: number;
  key: FindKey;
  query: FindQuery;
  records: readonly FindRecord[];
  work: 'match' | 'ranges';
  rangeInterest?: { id: number; scopes: readonly FindScope[] };
}
export type FindReply = { requestId: number; key: FindKey; workerGeneration: number } & (
  | { kind: 'matches'; records: readonly MatchingRecord[] }
  | { kind: 'ranges'; interestId: number; ranges: readonly FindScope[]; coverage: readonly FindCoverage[] }
  | { kind: 'failed'; reason: 'too-long' | 'timeout' | 'execution' }
);

const keyFields = ['viewerEpoch', 'targetEpoch', 'instanceEpoch', 'windowRevision', 'messageRevision', 'queryRevision'] as const;
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const integer = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;
function shape(value: unknown, required: readonly string[], optional: readonly string[] = []): value is Record<string, unknown> {
  return object(value) && required.every(key => Object.hasOwn(value, key)) &&
    Object.keys(value).every(key => required.includes(key) || optional.includes(key));
}
function validKey(value: unknown): value is FindKey {
  return shape(value, keyFields) && keyFields.every(key => integer(value[key]));
}
export function sameFindKey(a: FindKey, b: FindKey): boolean { return keyFields.every(key => a[key] === b[key]); }
export function sameRecordRef(a: RecordRef, b: RecordRef): boolean { return a.context === b.context && a.occurrence === b.occurrence; }
function validRef(value: unknown): value is RecordRef {
  return shape(value, ['context', 'occurrence']) && typeof value.context === 'string' && value.context.length > 0 &&
    value.context.length <= 4096 && integer(value.occurrence);
}

/** Count original UTF-8 bytes without allocating an encoded copy at the IPC
 * boundary. Length checks precede this scan, and retained input is bounded.
 */
function utf8Bytes(text: string): number {
  let bytes = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 0x80) bytes++;
    else if (code < 0x800) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length && text.charCodeAt(i + 1) >= 0xdc00 && text.charCodeAt(i + 1) <= 0xdfff) {
      bytes += 4; i++;
    } else bytes += 3;
  }
  return bytes;
}
function sourceBoundary(text: string, offset: number): boolean {
  return offset === 0 || offset === text.length || !(text.charCodeAt(offset - 1) >= 0xd800 && text.charCodeAt(offset - 1) <= 0xdbff &&
    text.charCodeAt(offset) >= 0xdc00 && text.charCodeAt(offset) <= 0xdfff);
}
function validScope(value: unknown, records: readonly FindRecord[]): value is FindScope {
  if (!shape(value, ['ref', 'source', 'start', 'end']) || !validRef(value.ref) ||
    (value.source !== 'application' && value.source !== 'message') || !integer(value.start) || !integer(value.end) || value.start >= value.end) return false;
  const record = records.find(record => sameRecordRef(record.ref, value.ref as RecordRef));
  const source = record?.[value.source];
  return source !== undefined && value.end <= source.length && sourceBoundary(source, value.start) && sourceBoundary(source, value.end);
}

/** No matcher/worker allocation before this succeeds. SDK serialization itself
 * is host-owned; this bounds accepted input, not the host's transport memory.
 */
export function findRequestProblem(value: unknown): 'invalid' | 'too-long' | undefined {
  if (!shape(value, ['requestId', 'key', 'query', 'records', 'work'], ['rangeInterest']) || !integer(value.requestId) || value.requestId === 0 ||
    !validKey(value.key) || !shape(value.query, ['text', 'matchCase', 'wholeWords']) || typeof value.query.text !== 'string' ||
    typeof value.query.matchCase !== 'boolean' || typeof value.query.wholeWords !== 'boolean') return 'invalid';
  if (value.query.text.length > FIND_QUERY_LIMIT) return 'too-long';
  if (!Array.isArray(value.records) || value.records.length > 1000) return 'invalid';
  const seen = new Set<number>();
  let applicationUnits = 0, messageUnits = 0, context: string | undefined;
  for (const record of value.records) {
    if (!shape(record, ['ref', 'application'], ['message']) || !validRef(record.ref) || typeof record.application !== 'string' ||
      (record.message !== undefined && typeof record.message !== 'string')) return 'invalid';
    context ??= record.ref.context;
    if (record.ref.context !== context || seen.has(record.ref.occurrence)) return 'invalid';
    seen.add(record.ref.occurrence);
    applicationUnits += record.application.length;
    messageUnits += (record.message as string | undefined)?.length ?? 0;
    if (applicationUnits > FIND_SOURCE_LIMIT || messageUnits > FIND_SOURCE_LIMIT) return 'invalid';
  }
  let bytes = 0;
  for (const record of value.records as FindRecord[]) {
    bytes += utf8Bytes(record.application);
    if (bytes > FIND_SOURCE_LIMIT) return 'invalid';
  }
  if (value.work === 'match') return value.rangeInterest === undefined ? undefined : 'invalid';
  if (value.work !== 'ranges' || !shape(value.rangeInterest, ['id', 'scopes']) || !integer(value.rangeInterest.id) ||
    !Array.isArray(value.rangeInterest.scopes) || value.rangeInterest.scopes.length > FIND_SCOPE_LIMIT ||
    !value.rangeInterest.scopes.every(scope => validScope(scope, value.records as FindRecord[]))) return 'invalid';
  return undefined;
}

/** Trust neither wire identity nor original-source bounds, including failures.
 * The caller separately checks the request against its current live intent/key.
 */
export function hasFindReplyIdentity(value: unknown, request: FindRequest, workerGeneration: number): value is Record<string, unknown> {
  return object(value) && value.requestId === request.requestId && value.workerGeneration === workerGeneration &&
    validKey(value.key) && sameFindKey(value.key, request.key);
}
export function isFindReply(value: unknown, request: FindRequest, workerGeneration: number): value is FindReply {
  if (!hasFindReplyIdentity(value, request, workerGeneration)) return false;
  const base = ['requestId', 'key', 'workerGeneration', 'kind'];
  if (value.kind === 'failed') return shape(value, [...base, 'reason']) && ['too-long', 'timeout', 'execution'].includes(value.reason as string);
  if (value.kind === 'matches') {
    if (request.work !== 'match' || !shape(value, [...base, 'records']) || !Array.isArray(value.records) || value.records.length > request.records.length) return false;
    let previous = -1;
    for (const match of value.records) {
      if (!shape(match, ['ref', 'application', 'message']) || !validRef(match.ref) || typeof match.application !== 'boolean' ||
        typeof match.message !== 'boolean' || (!match.application && !match.message)) return false;
      const index = request.records.findIndex(record => sameRecordRef(record.ref, match.ref as RecordRef));
      if (index <= previous || (match.message && request.records[index].message === undefined)) return false;
      previous = index;
    }
    return true;
  }
  const interest = request.rangeInterest;
  if (value.kind !== 'ranges' || request.work !== 'ranges' || !interest || value.interestId !== interest.id ||
    !shape(value, [...base, 'interestId', 'ranges', 'coverage']) || !Array.isArray(value.ranges) || value.ranges.length > FIND_RANGE_LIMIT ||
    !Array.isArray(value.coverage) || value.coverage.length !== interest.scopes.length) return false;
  const ends = new Map<string, number>();
  for (const range of value.ranges) {
    if (!validScope(range, request.records) || !interest.scopes.some(scope => sameRecordRef(scope.ref, range.ref) && scope.source === range.source &&
      scope.start < range.end && scope.end > range.start)) return false;
    const key = JSON.stringify([range.ref.context, range.ref.occurrence, range.source]);
    if (range.start < (ends.get(key) ?? 0)) return false;
    ends.set(key, range.end);
  }
  return value.coverage.every((entry, index) => {
    const scope = interest.scopes[index];
    return shape(entry, ['scope', 'complete']) && typeof entry.complete === 'boolean' && validScope(entry.scope, request.records) &&
      sameRecordRef(entry.scope.ref, scope.ref) && entry.scope.source === scope.source && entry.scope.start === scope.start && entry.scope.end === scope.end;
  });
}
