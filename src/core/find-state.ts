import { sameFindKey, type FindKey } from './find-protocol.ts';
import { emptyWindow, recordIndex, type OccurrenceWindow, type RecordRef } from './occurrences.ts';

export type FindEdit = 'new' | 'refine' | 'maintenance';
type Position = RecordRef | 'beginning' | 'end';
const sameRef = (a?: RecordRef, b?: RecordRef) => !!a && !!b && a.context === b.context && a.occurrence === b.occurrence;

/** Positions and permissions, independent of matching execution, inspection and
 * DOM focus. Only explicit actions authorize selection; useful data alone cannot.
 */
export class FindPosition {
  reading?: RecordRef;
  active?: RecordRef;
  candidate?: RecordRef;
  position?: Position;
  feedback = '';
  private window = emptyWindow('unopened');
  private key?: FindKey;
  private matches: readonly RecordRef[] = [];
  private serial = 0;
  private selection?: { id: number; key: FindKey; origin: Position; candidate?: RecordRef };
  private revealPermission?: number;
  private reveal?: { id: number; key: FindKey; ref: RecordRef };

  cancelReveal() { this.revealPermission = undefined; this.reveal = undefined; }
  cancelSelection() { this.selection = undefined; this.cancelReveal(); }
  clear() {
    this.cancelSelection(); this.active = this.candidate = this.position = undefined;
    this.matches = []; this.feedback = '';
  }
  reset() { this.clear(); this.reading = undefined; this.key = undefined; }
  closeInspection(ref?: RecordRef) {
    this.cancelSelection();
    if (sameRef(this.reading, ref)) {
      this.reading = undefined;
      // A successful candidate establishes its own search position, even when
      // it coincides with the reading row whose inspector is now closing.
      if (typeof this.position !== 'string' && sameRef(this.position, ref) && !sameRef(this.candidate, ref)) this.position = undefined;
    }
  }

  read(ref: RecordRef) {
    this.reading = ref; this.active = this.candidate = undefined; this.position = ref;
    this.cancelSelection(); this.feedback = '';
  }
  prepare(window: OccurrenceWindow, key: FindKey, edit: FindEdit) {
    this.window = window; this.key = key; this.matches = []; this.cancelSelection();
    const survives = (ref?: RecordRef) => recordIndex(window, ref) >= 0 ? ref : undefined;
    if (this.active && !survives(this.active)) this.feedback = 'Current result left the recent log window.';
    this.reading = survives(this.reading); this.active = survives(this.active); this.candidate = survives(this.candidate);
    if (typeof this.position !== 'string') this.position = survives(this.position);
    if (edit === 'new') {
      this.active = this.candidate = undefined; this.position = this.reading ?? 'beginning';
    }
    if (edit !== 'maintenance') {
      this.feedback = '';
      const id = ++this.serial;
      this.selection = { id, key, origin: this.position ?? this.reading ?? 'beginning', candidate: this.candidate };
      this.revealPermission = id;
    }
  }
  accept(key: FindKey, matches: readonly RecordRef[]) {
    if (!this.key || !sameFindKey(key, this.key)) return;
    this.matches = matches;
    const intent = this.selection;
    this.selection = undefined;
    if (intent) {
      const candidate = matches.find(ref => sameRef(ref, intent.candidate));
      const origin = typeof intent.origin === 'string' ? -1 : recordIndex(this.window, intent.origin);
      const found = candidate ?? matches.find(ref => recordIndex(this.window, ref) >= origin) ?? matches[0];
      this.active = found;
      if (found) {
        this.candidate = this.position = found;
        if (this.revealPermission === intent.id) this.reveal = { id: intent.id, key, ref: found };
      }
    } else this.active = matches.find(ref => sameRef(ref, this.active));
  }
  navigate(target: 1 | -1 | RecordRef) {
    if (!this.matches.length) return;
    const addressed = typeof target === 'object' ? this.matches.find(ref => sameRef(ref, target)) : undefined;
    if (typeof target === 'object' && !addressed) return;
    this.cancelSelection();
    const direction = typeof target === 'number' ? target : 1;
    const index = this.matches.findIndex(ref => sameRef(ref, this.active));
    const ordered = direction === 1 ? this.matches : [...this.matches].reverse();
    const origin = recordIndex(this.window, this.reading);
    const inclusive = origin < 0 ? ordered[0] : ordered.find(ref => direction * (recordIndex(this.window, ref) - origin) >= 0);
    const wrapped = index >= 0 ? index + direction < 0 || index + direction >= this.matches.length : !inclusive;
    const found = addressed ?? (index >= 0 ? this.matches[(index + direction + this.matches.length) % this.matches.length] : inclusive ?? ordered[0]);
    this.feedback = this.matches.length === 1 ? 'Only matching record' : !addressed && wrapped ? direction === 1 ? 'Wrapped to beginning' : 'Wrapped to end' : '';
    this.active = this.candidate = this.position = found;
    const id = ++this.serial;
    this.revealPermission = id;
    if (this.key) this.reveal = { id, key: this.key, ref: found };
  }
  takeReveal(window: OccurrenceWindow, key: FindKey): RecordRef | undefined {
    const intent = this.reveal;
    this.reveal = undefined;
    if (intent && this.revealPermission === intent.id && sameFindKey(intent.key, key) &&
      sameRef(intent.ref, this.active) && recordIndex(window, intent.ref) >= 0) return intent.ref;
  }
}
