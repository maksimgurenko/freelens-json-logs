import { sameRecordRef, FIND_SCOPE_LIMIT, type FindScope, type FindSource, type MatchingRecord } from '../core/find-protocol.ts';
import type { RecordRef } from '../core/occurrences.ts';
import { FindClient, type FindInputs } from './find-client.ts';
import { FindRanges, type RangeState } from './find-ranges.ts';

interface Fragment { node: Text; start: number }
interface SourceIndex { element: HTMLElement; ref: RecordRef; source: FindSource; fragments: Fragment[]; visible: FindScope[] }
interface Clip { top: number; right: number; bottom: number; left: number }
export interface HighlightStatus { message: string; retryable: boolean }
const intersects = (a: Clip, b: Clip) => a.bottom > b.top && a.top < b.bottom && a.right > b.left && a.left < b.right;
const inside = (a: Clip, b: Clip) => a.top >= b.top && a.bottom <= b.bottom && a.left >= b.left && a.right <= b.right;
const intersect = (a: Clip, b: Clip): Clip => ({ top: Math.max(a.top, b.top), right: Math.min(a.right, b.right),
  bottom: Math.min(a.bottom, b.bottom), left: Math.max(a.left, b.left) });
const boundary = (text: string, offset: number) => offset > 0 && offset < text.length &&
  /[\uD800-\uDBFF]/.test(text[offset - 1]) && /[\uDC00-\uDFFF]/.test(text[offset]) ? offset - 1 : offset;

/** The index belongs to one accepted presentation revision. Every mapped node
 * contains an exact source slice, never pretty JSON or a guessed decoded path.
 * Geometry affects decoration interest only, not exact membership or reveals.
 */
export class FindHighlights {
  private root: HTMLElement;
  private sources: SourceIndex[] = [];
  private inputs?: FindInputs;
  private matches: readonly MatchingRecord[] = [];
  private active?: RecordRef;
  private revision = 0;
  private frame = 0;
  private closed = false;
  private resize: ResizeObserver;
  private ranges: FindRanges;
  private names: string[];
  private style: HTMLStyleElement;
  private interestCapped = false;
  private status: HighlightStatus = { message: '', retryable: false };
  private changed: (status: HighlightStatus) => void;
  constructor(root: HTMLElement, client: FindClient, identity: number, changed: (status: HighlightStatus) => void) {
    this.root = root; this.changed = changed;
    this.names = [`rl-find-${identity}`, `rl-find-active-${identity}`];
    this.style = root.ownerDocument.createElement('style');
    this.style.textContent = `::highlight(${this.names[0]}) { background: #66521a; color: #fff; }
      ::highlight(${this.names[1]}) { background: #e6b850; color: #000; text-decoration: underline; }`;
    root.append(this.style);
    this.ranges = new FindRanges(client, state => this.draw(state));
    root.addEventListener('scroll', this.schedule, true);
    root.ownerDocument.defaultView?.addEventListener('resize', this.schedule);
    root.ownerDocument.fonts.addEventListener('loadingdone', this.schedule);
    void root.ownerDocument.fonts.ready.then(() => { if (!this.closed) this.schedule(); });
    this.resize = new ResizeObserver(this.schedule); this.resize.observe(root);
  }
  update(inputs: FindInputs | undefined, matches: readonly MatchingRecord[], active?: RecordRef) {
    if (this.closed) return;
    this.revision++; this.inputs = inputs; this.matches = matches; this.active = active;
    this.resize.disconnect(); this.resize.observe(this.root);
    this.sources = inputs ? Array.from(this.root.querySelectorAll<HTMLElement>('[data-find-source]')).map(element => {
      const source = { element, source: element.dataset.findSource as FindSource,
        ref: { context: element.dataset.findContext!, occurrence: Number(element.dataset.findOccurrence) },
        visible: [] as FindScope[], fragments: Array.from(element.querySelectorAll<HTMLElement>('[data-source-start]')).map(fragment =>
          ({ node: fragment.firstChild as Text, start: Number(fragment.dataset.sourceStart) })).filter(fragment => !!fragment.node) };
      this.resize.observe(element);
      // Local status/toolbar layout can expose text by resizing its clipping
      // scroller while the root and source keep exactly the same dimensions.
      for (const parent of this.clippingParents(element)) this.resize.observe(parent);
      return source;
    }) : [];
    this.clearHighlights();
    if (!inputs) { this.ranges.clear(); return; }
    this.schedule();
  }
  retry() { this.ranges.retry(); }
  suspend() { this.update(undefined, []); }
  private schedule = () => {
    if (this.closed || this.frame) return;
    this.frame = requestAnimationFrame(() => { this.frame = 0; this.measure(); });
  };
  private clippingParents(element: HTMLElement): HTMLElement[] {
    const parents: HTMLElement[] = [];
    for (let parent = element.parentElement; parent && parent !== this.root; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      if (/(auto|scroll|hidden|clip)/.test(`${style.overflowX} ${style.overflowY}`)) parents.push(parent);
    }
    return parents;
  }
  private clip(element: HTMLElement): Clip {
    let clip: Clip = this.root.getBoundingClientRect();
    for (const parent of this.clippingParents(element)) {
      const rect = parent.getBoundingClientRect();
      clip = intersect(clip, { top: rect.top + parent.clientTop, left: rect.left + parent.clientLeft,
        right: rect.left + parent.clientLeft + parent.clientWidth, bottom: rect.top + parent.clientTop + parent.clientHeight });
    }
    return clip;
  }
  private measure() {
    if (!this.inputs || this.closed) return;
    if (!globalThis.CSS?.highlights || !globalThis.Highlight) {
      this.setStatus('Highlighting unavailable. Exact matches remain available.'); return;
    }
    const scopes: FindScope[] = [];
    this.interestCapped = false;
    const ordered = [...this.sources].sort((a, b) => Number(!!this.active && sameRecordRef(b.ref, this.active)) -
      Number(!!this.active && sameRecordRef(a.ref, this.active)));
    for (const source of ordered) {
      source.visible = [];
      if (!source.element.checkVisibility() || !this.matches.some(match => sameRecordRef(match.ref, source.ref) && match[source.source])) continue;
      const clip = this.clip(source.element);
      if (!intersects(source.element.getBoundingClientRect(), clip)) continue;
      for (const fragment of source.fragments) {
        const range = this.root.ownerDocument.createRange();
        const visit = (start: number, end: number) => {
          if (scopes.length === FIND_SCOPE_LIMIT) { this.interestCapped = true; return; }
          range.setStart(fragment.node, start); range.setEnd(fragment.node, end);
          if (!Array.from(range.getClientRects()).some(rect => intersects(rect, clip))) return;
          if (end - start <= 32 || inside(range.getBoundingClientRect(), clip)) {
            const absolute = { ref: source.ref, source: source.source, start: fragment.start + start, end: fragment.start + end };
            const previous = source.visible.at(-1);
            if (previous && sameRecordRef(previous.ref, absolute.ref) && previous.source === absolute.source && previous.end === absolute.start) previous.end = absolute.end;
            else { scopes.push(absolute); source.visible.push(absolute); }
            return;
          }
          const middle = boundary(fragment.node.data, Math.floor((start + end) / 2));
          if (middle <= start) return;
          visit(start, middle); visit(middle, end);
        };
        visit(0, fragment.node.length);
      }
    }
    // Duplicate viewport/inspector presentations can request the same source.
    const unique = [...new Map(scopes.map(scope => [JSON.stringify(scope), scope])).values()];
    const previous = this.ranges.state;
    this.ranges.update(this.inputs, unique, this.revision);
    // Covered interest can reuse ready data without publishing a new reply.
    // Project those ranges through this measurement's current visible spans.
    if (this.ranges.state === previous) this.draw(previous);
  }
  private nativeRange(source: SourceIndex, scope: FindScope): Range | undefined {
    const start = source.fragments.find(fragment => fragment.start <= scope.start && fragment.start + fragment.node.length > scope.start);
    const end = source.fragments.find(fragment => fragment.start < scope.end && fragment.start + fragment.node.length >= scope.end);
    if (!start || !end) return;
    const range = this.root.ownerDocument.createRange();
    range.setStart(start.node, scope.start - start.start); range.setEnd(end.node, scope.end - end.start);
    return range;
  }
  private draw(state: RangeState) {
    this.clearHighlights();
    if (this.closed) return;
    if (state.phase !== 'ready') {
      this.setStatus(state.phase === 'failed' ? 'Highlighting incomplete. Retry highlights to try again; exact matches remain available.'
        : state.phase === 'pending' ? 'Highlighting pending; exact matches remain available.' : '', state.phase === 'failed');
      return;
    }
    if (!globalThis.CSS?.highlights || !globalThis.Highlight) return;
    const highlights = [new Highlight(), new Highlight()]; highlights[1].priority = 1;
    const presentations = this.sources.filter(source => source.element.checkVisibility()).map(source => ({ source,
      ranges: state.ranges.filter(range => range.source === source.source && sameRecordRef(range.ref, source.ref) &&
        source.visible.some(scope => scope.start < range.end && scope.end > range.start)) }));
    presentations.sort((a, b) => Number(!!this.active && sameRecordRef(b.source.ref, this.active)) -
      Number(!!this.active && sameRecordRef(a.source.ref, this.active)));
    let count = 0, round = 0, remaining = true;
    // Round-robin across visible presentations, active content first. Allocate
    // native Ranges only when a shared DOM slot is actually available.
    while (remaining && count < 1024) {
      remaining = false;
      for (const presentation of presentations) {
        const scope = presentation.ranges[round];
        if (!scope) continue;
        remaining = true;
        const range = this.nativeRange(presentation.source, scope);
        if (range) { highlights[this.active && sameRecordRef(presentation.source.ref, this.active) ? 1 : 0].add(range); count++; }
        if (count === 1024) break;
      }
      round++;
    }
    this.names.forEach((name, index) => CSS.highlights.set(name, highlights[index]));
    const incomplete = !state.complete || this.interestCapped || presentations.reduce((sum, entry) => sum + entry.ranges.length, 0) > count;
    this.setStatus(incomplete ? 'Highlighting incomplete: visible text exceeds the decoration limit. Exact matches remain available.' : '');
  }
  private clearHighlights() { this.names.forEach(name => globalThis.CSS?.highlights?.delete(name)); }
  private setStatus(message: string, retryable = false) {
    if (message !== this.status.message || retryable !== this.status.retryable) {
      this.status = { message, retryable }; this.changed(this.status);
    }
  }
  dispose() {
    if (this.closed) return;
    this.closed = true; cancelAnimationFrame(this.frame); this.frame = 0; this.resize.disconnect();
    this.root.removeEventListener('scroll', this.schedule, true);
    this.root.ownerDocument.defaultView?.removeEventListener('resize', this.schedule);
    this.root.ownerDocument.fonts.removeEventListener('loadingdone', this.schedule);
    this.ranges.dispose(); this.clearHighlights(); this.style.remove(); this.sources = []; this.matches = []; this.inputs = undefined;
  }
}
