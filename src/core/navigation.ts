import type { LogRecord } from './records.ts';

/** Longest old suffix/new prefix. KMP keeps repeated-line alignment linear.
 * This maps the observed ordered overlap, never merges or deduplicates records.
 * Identical whole windows cannot reveal unobserved additions of identical lines.
 */
export function windowOverlap(previous: readonly LogRecord[], next: readonly LogRecord[]): number {
  if (!next.length) return 0;
  const prefix = new Array<number>(next.length).fill(0);
  for (let i = 1, j = 0; i < next.length; i++) {
    while (j && next[i].transportLine !== next[j].transportLine) j = prefix[j - 1];
    if (next[i].transportLine === next[j].transportLine) j++;
    prefix[i] = j;
  }
  let matched = 0;
  for (const record of previous) {
    while (matched && (matched === next.length || record.transportLine !== next[matched].transportLine)) matched = prefix[matched - 1];
    if (record.transportLine === next[matched].transportLine) matched++;
  }
  return matched;
}

/** The one predicate supplies both the count and navigation; each record occurs once. */
export function findMatches(records: readonly LogRecord[], messages: readonly string[], query: string): number[] {
  if (!query) return [];
  const needle = query.toLowerCase();
  const matches: number[] = [];
  records.forEach((record, index) => {
    if (record.applicationText.toLowerCase().includes(needle) || messages[index]?.toLowerCase().includes(needle)) matches.push(index);
  });
  return matches;
}

export function moveMatch(matches: readonly number[], current: number, direction: 1 | -1): number {
  if (!matches.length) return -1;
  const position = matches.indexOf(current);
  if (position < 0) return direction === 1 ? matches[0] : matches[matches.length - 1];
  return matches[(position + direction + matches.length) % matches.length];
}
