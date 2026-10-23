import { parseTransportLine, type LogRecord } from './records.ts';

export const TAIL_LINES = 1000;
export const ORIGINAL_TEXT_BUDGET = 5 * 1024 * 1024;
export interface LogSnapshot {
  records: LogRecord[];
  returnedLines: number;
  omittedLines: number;
  retainedBytes: number;
  oversizedNewest: boolean;
}

/** Keep a complete-line suffix, counting exact original UTF-8 bytes including LF separators. */
export function retainSnapshot(response: string): LogSnapshot {
  if (!response) return { records: [], returnedLines: 0, omittedLines: 0, retainedBytes: 0, oversizedNewest: false };
  const lines = response.split('\n');
  const terminated = lines.at(-1) === '';
  if (terminated) lines.pop(); // A terminal separator is not an extra blank record.
  const encoder = new TextEncoder();
  let retainedBytes = 0;
  let start = lines.length;
  let oversizedNewest = false;
  const firstEligible = Math.max(0, lines.length - TAIL_LINES);
  for (let index = lines.length - 1; index >= firstEligible; index--) {
    const size = encoder.encode(lines[index]).byteLength + (index < lines.length - 1 || terminated ? 1 : 0);
    if (retainedBytes + size > ORIGINAL_TEXT_BUDGET) {
      oversizedNewest = index === lines.length - 1;
      break;
    }
    retainedBytes += size;
    start = index;
  }
  return { records: lines.slice(start).map(parseTransportLine), returnedLines: lines.length,
    omittedLines: start, retainedBytes, oversizedNewest };
}
