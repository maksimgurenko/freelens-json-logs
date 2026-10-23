import { clipboard } from 'electron';
import { originalText } from '../core/inspection.ts';
import type { LogRecord } from '../core/records.ts';

/** Electron owns clipboard access; never stringify a parsed record for exact copy. */
export function copyOriginal(record: LogRecord, content: 'application' | 'transport') {
  clipboard.writeText(originalText(record, content));
}
