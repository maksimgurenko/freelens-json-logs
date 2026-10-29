import type { LogRecord } from './records.ts';
import { windowOverlap } from './navigation.ts';

export interface RecordRef { readonly context: string; readonly occurrence: number }
export interface OccurrenceWindow {
  readonly context: string;
  readonly records: readonly LogRecord[];
  readonly refs: readonly RecordRef[];
  readonly nextId: number;
}

export function emptyWindow(context: string): OccurrenceWindow {
  return { context, records: [], refs: [], nextId: 0 };
}

/** Carry identities only through the observed overlap. Never merge records or
 * recover an evicted reference by equal text. Identical windows retain IDs;
 * unseen additions of identical lines cannot be inferred without a cursor.
 */
export function replaceWindow(previous: OccurrenceWindow, records: readonly LogRecord[]): OccurrenceWindow {
  if (previous.records === records) return previous;
  const overlap = windowOverlap(previous.records, records);
  const refs = previous.refs.slice(previous.records.length - overlap);
  let nextId = previous.nextId;
  while (refs.length < records.length) refs.push({ context: previous.context, occurrence: nextId++ });
  return { context: previous.context, records, refs, nextId };
}

export function recordRef(window: OccurrenceWindow, index: number): RecordRef | undefined {
  return window.refs[index];
}

export function recordIndex(window: OccurrenceWindow, ref?: RecordRef): number {
  if (!ref || ref.context !== window.context) return -1;
  return window.refs.findIndex(entry => entry.occurrence === ref.occurrence);
}
