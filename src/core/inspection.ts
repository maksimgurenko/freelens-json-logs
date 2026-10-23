import type { LogRecord } from './records.ts';

export type RecordContent = 'fields' | 'application' | 'transport';
export interface RecordSelection { transportLine: string; occurrenceFromEnd: number }
export interface InspectionState { raw: boolean; content: RecordContent; selected?: RecordSelection }
export const initialInspection = (): InspectionState => ({ raw: false, content: 'fields' });

/** An index is never carried over to a different record after snapshot replacement. */
export function selectRecord(records: readonly LogRecord[], index: number): RecordSelection | undefined {
  const record = records[index];
  if (!record) return;
  let occurrenceFromEnd = 0;
  for (let i = records.length - 1; i > index; i--) if (records[i].transportLine === record.transportLine) occurrenceFromEnd++;
  return { transportLine: record.transportLine, occurrenceFromEnd };
}
export function selectedIndex(records: readonly LogRecord[], selection?: RecordSelection): number {
  if (!selection) return -1;
  let occurrence = 0;
  for (let i = records.length - 1; i >= 0; i--) {
    if (records[i].transportLine === selection.transportLine && occurrence++ === selection.occurrenceFromEnd) return i;
  }
  return -1;
}
export function originalText(record: LogRecord, content: 'application' | 'transport'): string {
  return content === 'application' ? record.applicationText : record.transportLine;
}
