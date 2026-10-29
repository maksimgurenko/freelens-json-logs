import { groupFindMarks, nextMarkMember, type FindMarkGroup } from '../core/find-marks.ts';
import { recordIndex, type OccurrenceWindow, type RecordRef } from '../core/occurrences.ts';
import { sameRecordRef } from '../core/find-protocol.ts';

interface MarkView { group: FindMarkGroup; button: HTMLButtonElement; activate: () => void; last?: RecordRef }
const membership = (group: FindMarkGroup) => JSON.stringify(group.members);

/** Current-layout geometry and a bounded rail, independent of highlight output.
 * Rows are measured after commit, never estimated from ordinal/average height.
 */
export class FindMarks {
  private scroller: HTMLElement;
  private rail: HTMLElement;
  private navigate: (ref: RecordRef) => void;
  private window?: OccurrenceWindow;
  private matches: readonly RecordRef[] = [];
  private active?: RecordRef;
  private lastActivated?: RecordRef;
  private queryRevision?: number;
  private views: MarkView[] = [];
  private frame = 0;
  private closed = false;
  private resize: ResizeObserver;
  private mutations: MutationObserver;

  constructor(scroller: HTMLElement, rail: HTMLElement, navigate: (ref: RecordRef) => void) {
    this.scroller = scroller; this.rail = rail; this.navigate = navigate;
    this.resize = new ResizeObserver(this.schedule);
    this.mutations = new MutationObserver(this.schedule);
    this.mutations.observe(scroller, { childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
    scroller.ownerDocument.defaultView?.addEventListener('resize', this.schedule);
    scroller.ownerDocument.fonts.addEventListener('loadingdone', this.schedule);
    void scroller.ownerDocument.fonts.ready.then(() => { if (!this.closed) this.schedule(); });
    rail.hidden = true;
  }
  update(window: OccurrenceWindow, matches: readonly RecordRef[], active: RecordRef | undefined, queryRevision: number) {
    if (this.closed) return;
    // Pending maintenance hides the rail without ending this query's cycle.
    // A new edit/context or an evicted occurrence cannot inherit that progress.
    if (this.window?.context !== window.context || this.queryRevision !== queryRevision) {
      this.lastActivated = undefined;
      for (const view of this.views) view.last = undefined;
    }
    if (this.lastActivated && recordIndex(window, this.lastActivated) < 0) this.lastActivated = undefined;
    this.queryRevision = queryRevision;
    this.window = window; this.matches = matches; this.active = active;
    this.resize.disconnect();
    if (!matches.length) { this.clear(); return; }
    this.resize.observe(this.scroller);
    for (const row of this.scroller.querySelectorAll<HTMLElement>('[data-record-index]')) this.resize.observe(row);
    this.schedule();
  }
  private schedule = () => {
    if (this.closed || !this.matches.length || this.frame) return;
    this.frame = requestAnimationFrame(() => { this.frame = 0; this.measure(); });
  };
  private measure() {
    if (this.closed || !this.window || !this.matches.length) return;
    if (!this.scroller.checkVisibility() || !this.scroller.clientHeight) { this.clear(); return; }
    const top = this.scroller.getBoundingClientRect().top + this.scroller.clientTop;
    // Numeric indices resolve only within this currently accepted immutable
    // window. Neither measurements nor buttons retain them across replacements.
    const positions = new Map<number, number>();
    for (const row of this.scroller.querySelectorAll<HTMLElement>('[data-record-index]')) {
      const ref = this.window.refs[Number(row.dataset.recordIndex)];
      if (ref) positions.set(ref.occurrence, row.getBoundingClientRect().top - top + this.scroller.scrollTop);
    }
    const measured = this.matches.flatMap(ref => {
      const position = ref.context === this.window!.context ? positions.get(ref.occurrence) : undefined;
      return position === undefined ? [] : [{ ref, top: position }];
    });
    const groups = groupFindMarks(measured, this.scroller.scrollHeight, this.scroller.clientHeight);
    const previous = new Map(this.views.map(view => [membership(view.group), view]));
    const next = groups.map(group => {
      const view = previous.get(membership(group)) ?? this.create(group);
      view.group = group; view.button.style.top = `${group.top}px`;
      const active = !!this.active && group.members.some(ref => sameRecordRef(ref, this.active!));
      const ordinal = this.matches.findIndex(ref => sameRecordRef(ref, group.members[0])) + 1;
      const label = group.members.length === 1 ? `Find matching record ${ordinal} of ${this.matches.length}`
        : `Find ${group.members.length} matching records, starting at ${ordinal} of ${this.matches.length}; activate to cycle`;
      view.button.setAttribute('aria-label', label);
      view.button.title = label;
      if (active) view.button.setAttribute('aria-current', 'true'); else view.button.removeAttribute('aria-current');
      return view;
    });
    for (const view of this.views) if (!next.includes(view)) this.remove(view);
    next.forEach((view, index) => {
      if (this.rail.children[index] !== view.button) this.rail.insertBefore(view.button, this.rail.children[index] ?? null);
    });
    this.views = next; this.rail.hidden = !next.length;
  }
  private create(group: FindMarkGroup): MarkView {
    const button = this.rail.ownerDocument.createElement('button');
    button.type = 'button'; button.className = 'rl-find-mark';
    const activate = () => {
      if (!this.views.includes(view) || !this.window) return;
      // Capture the explicit target before a layout change can split/merge its
      // group. Remeasure that same occurrence; query/dismissal/eviction changes
      // invalidate the control or ref independently of its current screen slot.
      const ref = nextMarkMember(view.group, view.last);
      this.measure();
      if (recordIndex(this.window, ref) < 0 || !this.matches.some(match => sameRecordRef(match, ref))) return;
      const current = this.views.find(view => view.group.members.some(member => sameRecordRef(member, ref)));
      if (!current) return;
      current.last = ref; this.lastActivated = ref; this.navigate(ref);
    };
    // Feedback/layout changes can rebuild a slot between successive clicks.
    // Carry progress only when that same occurrence belongs to the new group.
    const last = group.members.find(ref => this.lastActivated && sameRecordRef(ref, this.lastActivated));
    const view: MarkView = { group, button, activate, last };
    button.addEventListener('click', activate);
    return view;
  }
  private remove(view: MarkView) { view.button.removeEventListener('click', view.activate); view.button.remove(); }
  private clear() {
    cancelAnimationFrame(this.frame); this.frame = 0;
    for (const view of this.views) this.remove(view);
    this.views = []; this.rail.hidden = true;
  }
  dispose() {
    if (this.closed) return;
    this.closed = true; this.resize.disconnect(); this.mutations.disconnect();
    this.scroller.ownerDocument.defaultView?.removeEventListener('resize', this.schedule);
    this.scroller.ownerDocument.fonts.removeEventListener('loadingdone', this.schedule);
    this.matches = []; this.window = undefined; this.active = undefined; this.lastActivated = undefined; this.clear();
  }
}
