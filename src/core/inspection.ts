import type { LogRecord } from './records.ts';
import type { RecordRef } from './occurrences.ts';

export type RecordContent = 'fields' | 'application' | 'transport' | 'message';
export interface InspectionState { raw: boolean; content: RecordContent; selected?: RecordRef }
export const initialInspection = (): InspectionState => ({ raw: false, content: 'fields' });

export function originalText(record: LogRecord, content: 'application' | 'transport'): string {
  return content === 'application' ? record.applicationText : record.transportLine;
}
