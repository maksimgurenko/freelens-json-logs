import type { RecordRef } from './occurrences.ts';

export interface MeasuredMatch { ref: RecordRef; top: number }
export interface FindMarkGroup { top: number; members: readonly RecordRef[] }
export const FIND_MARK_SLOT = 7;

/** Inputs are actual content coordinates, in matching-record order. Decorations
 * and row ordinals play no part in mark membership or cross-window identity.
 */
export function groupFindMarks(matches: readonly MeasuredMatch[], contentHeight: number, trackHeight: number): FindMarkGroup[] {
  const slots = Math.floor(trackHeight / FIND_MARK_SLOT);
  if (slots < 1 || contentHeight <= 0) return [];
  const groups = new Map<number, RecordRef[]>();
  for (const { ref, top } of matches) {
    const slot = Math.max(0, Math.min(slots - 1, Math.floor(top / contentHeight * slots)));
    const members = groups.get(slot) ?? [];
    members.push(ref); groups.set(slot, members);
  }
  return Array.from(groups, ([slot, members]) => ({ top: slot * FIND_MARK_SLOT, members }));
}

export function nextMarkMember(group: FindMarkGroup, previous?: RecordRef): RecordRef {
  const index = group.members.findIndex(ref => ref.context === previous?.context && ref.occurrence === previous.occurrence);
  return group.members[(index + 1) % group.members.length];
}
