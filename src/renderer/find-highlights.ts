import { sameRecordRef, FIND_PENDING_MS, FIND_SCOPE_LIMIT, type FindScope, type FindSource, type MatchingRecord } from '../core/find-protocol.ts';
import type { RecordRef } from '../core/occurrences.ts';
import { FindClient, type FindInputs } from './find-client.ts';
import { FindRanges, type RangeState } from './find-ranges.ts';

interface Fragment { node: Text; start: number; bounds?: Clip; geometry?: number }
interface SourceIndex { element: HTMLElement; ref: RecordRef; source: FindSource; fragments: Fragment[]; parents: HTMLElement[]; visible: FindScope[]; width?: number; height?: number }
interface Clip { top: number; right: number; bottom: number; left: number }
export interface HighlightStatus { message: string; retryable: boolean; busy: boolean }
export const HIGHLIGHT_LIMIT_MESSAGE = 'Highlighting incomplete.';
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
  private matching = false;
  private matches: readonly MatchingRecord[] = [];
  private active?: RecordRef;
  private revision = 0;
  private geometry = 0;
  private frame = 0;
  private pendingFeedback?: ReturnType<typeof setTimeout>;
  private closed = false;
  private resize: ResizeObserver;
  private observed = new Set<HTMLElement>();
  private ranges: FindRanges;
  private names: string[];
  private style: HTMLStyleElement;
  private interestCapped = false;
  private status: HighlightStatus = { message: '', retryable: false, busy: false };
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
    root.ownerDocument.defaultView?.addEventListener('resize', this.invalidateGeometry);
    root.ownerDocument.fonts.addEventListener('loadingdone', this.invalidateGeometry);
    void root.ownerDocument.fonts.ready.then(() => { if (!this.closed) this.invalidateGeometry(); });
    this.resize = new ResizeObserver(this.invalidateGeometry); this.resize.observe(root); this.observed.add(root);
  }
  update(inputs: FindInputs | undefined, matches: readonly MatchingRecord[], active?: RecordRef, matching = false) {
    if (this.closed) return;
    const previous = this.inputs;
    const reusable = !!inputs && !!previous && inputs.key.viewerEpoch === previous.key.viewerEpoch &&
      inputs.key.targetEpoch === previous.key.targetEpoch && inputs.key.instanceEpoch === previous.key.instanceEpoch &&
      inputs.key.queryRevision === previous.key.queryRevision && inputs.query.text === previous.query.text &&
      inputs.query.matchCase === previous.query.matchCase && inputs.query.wholeWords === previous.query.wholeWords;
    // A retained occurrence can change its extracted message after formatting.
    // Keep only native ranges on the same connected, unchanged source nodes.
    const retained = new Map<Text, RecordRef>();
    const records = new Map(inputs?.records.map(record => [JSON.stringify(record.ref), record]));
    const oldRecords = new Map(previous?.records.map(record => [JSON.stringify(record.ref), record]));
    const unchanged = (source: SourceIndex) => {
      const key = JSON.stringify(source.ref);
      return source.element.isConnected && records.has(key) && records.get(key)![source.source] === oldRecords.get(key)?.[source.source];
    };
    if (reusable) {
      for (const source of this.sources) {
        if (unchanged(source))
          for (const fragment of source.fragments) if (fragment.node.isConnected) retained.set(fragment.node, source.ref);
      }
    }
    if (reusable && globalThis.Highlight) {
      const kept = [new Highlight(), new Highlight()]; kept[1].priority = 1;
      for (const name of this.names) {
        const highlight = globalThis.CSS?.highlights?.get(name);
        if (highlight) for (const range of highlight) {
          const ref = retained.get(range.startContainer as Text);
          if (ref && retained.has(range.endContainer as Text)) kept[active && sameRecordRef(ref, active) ? 1 : 0].add(range);
        }
      }
      if (globalThis.CSS?.highlights) this.names.forEach((name, index) => CSS.highlights.set(name, kept[index]));
    } else this.clearHighlights();
    this.revision++; this.inputs = inputs; this.matches = matches; this.active = active;
    this.matching = matching;
    const indexes = new Map(this.sources.map(source => [source.element, source]));
    const parents = new Map<HTMLElement, HTMLElement[]>();
    this.sources = inputs ? Array.from(this.root.querySelectorAll<HTMLElement>('[data-find-source]')).map(element => {
      const indexed = indexes.get(element);
      if (indexed && unchanged(indexed)) { indexed.visible = []; return indexed; }
      return { element, source: element.dataset.findSource as FindSource,
        ref: { context: element.dataset.findContext!, occurrence: Number(element.dataset.findOccurrence) },
        parents: this.clippingParents(element, parents),
        visible: [] as FindScope[], fragments: Array.from(element.querySelectorAll<HTMLElement>('[data-source-start]')).map(fragment =>
          ({ node: fragment.firstChild as Text, start: Number(fragment.dataset.sourceStart) })).filter(fragment => !!fragment.node) };
    }) : [];
    // Preserve observers for retained sources rather than re-observing every
    // row (which also queues initial resize callbacks on every snapshot).
    const observed = new Set([this.root, ...this.sources.flatMap(source => [source.element, ...source.parents])]);
    for (const element of this.observed) if (!observed.has(element)) this.resize.unobserve(element);
    for (const element of observed) if (!this.observed.has(element)) this.resize.observe(element);
    this.observed = observed;
    if (!inputs) { this.ranges.clear(); return; }
    // Exact matching owns the shared worker until this snapshot is accepted.
    // Do not dispatch obsolete decoration or erase still-valid source ranges.
    if (matching) { this.ranges.pause(); return; }
    this.schedule();
  }
  retry() { this.ranges.retry(); }
  suspend() { this.update(undefined, []); }
  private schedule = () => {
    if (this.closed || this.frame) return;
    this.frame = requestAnimationFrame(() => { this.frame = 0; this.measure(); });
  };
  private invalidateGeometry = () => { this.geometry++; this.schedule(); };
  private clippingParents(element: HTMLElement, cache: Map<HTMLElement, HTMLElement[]>): HTMLElement[] {
    const parent = element.parentElement;
    if (!parent || parent === this.root) return [];
    const cached = cache.get(parent);
    if (cached) return cached;
    const style = getComputedStyle(parent);
    const parents = this.clippingParents(parent, cache);
    const result = /(auto|scroll|hidden|clip)/.test(`${style.overflowX} ${style.overflowY}`) ? [parent, ...parents] : parents;
    cache.set(parent, result); return result;
  }
  private clip(source: SourceIndex, root: Clip, clips: Map<HTMLElement, Clip>): Clip {
    let clip = root;
    for (const parent of source.parents) {
      let bounds = clips.get(parent);
      if (!bounds) {
        const rect = parent.getBoundingClientRect();
        bounds = { top: rect.top + parent.clientTop, left: rect.left + parent.clientLeft,
          right: rect.left + parent.clientLeft + parent.clientWidth, bottom: rect.top + parent.clientTop + parent.clientHeight };
        clips.set(parent, bounds);
      }
      clip = intersect(clip, bounds);
    }
    return clip;
  }
  private measure() {
    if (!this.inputs || this.closed || this.matching) return;
    if (!globalThis.CSS?.highlights || !globalThis.Highlight) {
      this.setStatus('Highlighting unavailable. Exact matches remain available.'); return;
    }
    const scopes: FindScope[] = [];
    this.interestCapped = false;
    const clips = new Map<HTMLElement, Clip>(), root = this.root.getBoundingClientRect();
    const matches = new Map(this.matches.map(match => [JSON.stringify(match.ref), match]));
    const ordered = [...this.sources].sort((a, b) => Number(!!this.active && sameRecordRef(b.ref, this.active)) -
      Number(!!this.active && sameRecordRef(a.ref, this.active)));
    for (const source of ordered) {
      source.visible = [];
      if (!matches.get(JSON.stringify(source.ref))?.[source.source]) continue;
      const clip = this.clip(source, root, clips);
      const bounds = source.element.getBoundingClientRect();
      if (!intersects(bounds, clip)) continue;
      if (!source.element.checkVisibility()) continue;
      if (source.width !== bounds.width || source.height !== bounds.height) {
        for (const fragment of source.fragments) fragment.geometry = undefined;
        source.width = bounds.width; source.height = bounds.height;
      }
      const relativeClip = { top: clip.top - bounds.top, bottom: clip.bottom - bounds.top,
        left: clip.left - bounds.left, right: clip.right - bounds.left };
      for (const fragment of source.fragments) {
        // A source can contain hundreds of mounted fragments. Their bounds
        // relative to the source survive scrolling, including bidi/wrapped
        // text; size/font/presentation changes invalidate the cache.
        if (fragment.geometry !== this.geometry) {
          const rect = fragment.node.parentElement!.getBoundingClientRect();
          fragment.bounds = { top: rect.top - bounds.top, bottom: rect.bottom - bounds.top,
            left: rect.left - bounds.left, right: rect.right - bounds.left };
          fragment.geometry = this.geometry;
        }
        if (!intersects(fragment.bounds!, relativeClip)) continue;
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
    // Quantize interest to nearby source offsets so small scrolls reuse a
    // covering reply. Keep the actual visible spans separate for DOM painting.
    const records = new Map(this.inputs.records.map(record => [JSON.stringify(record.ref), record]));
    const padded = scopes.map(scope => {
      const text = records.get(JSON.stringify(scope.ref))![scope.source]!;
      return { ...scope, start: boundary(text, Math.floor(scope.start / 256) * 256),
        end: boundary(text, Math.min(text.length, Math.ceil(scope.end / 256) * 256)) };
    });
    const unique = [...new Map(padded.map(scope => [JSON.stringify(scope), scope])).values()];
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
    if (this.closed) return;
    if (state.phase === 'pending') {
      this.setStatus(this.status.retryable ? '' : this.status.message, false, true);
      if (!this.pendingFeedback && this.status.message !== 'Highlighting pending.')
        this.pendingFeedback = setTimeout(() => { this.pendingFeedback = undefined; this.setStatus('Highlighting pending.', false, true); }, FIND_PENDING_MS);
      return;
    }
    clearTimeout(this.pendingFeedback); this.pendingFeedback = undefined;
    if (state.phase !== 'ready') {
      this.setStatus(state.phase === 'failed' ? 'Highlighting incomplete. Retry highlights to try again; exact matches remain available.' : '', state.phase === 'failed');
      return;
    }
    if (!globalThis.CSS?.highlights || !globalThis.Highlight) return;
    const highlights = [new Highlight(), new Highlight()]; highlights[1].priority = 1;
    const presentations = this.sources.filter(source => source.visible.length).map(source => ({ source,
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
    this.setStatus(incomplete ? HIGHLIGHT_LIMIT_MESSAGE : '');
  }
  private clearHighlights() { this.names.forEach(name => globalThis.CSS?.highlights?.delete(name)); }
  private setStatus(message: string, retryable = false, busy = false) {
    if (message !== this.status.message || retryable !== this.status.retryable || busy !== this.status.busy) {
      this.status = { message, retryable, busy }; this.changed(this.status);
    }
  }
  dispose() {
    if (this.closed) return;
    this.closed = true; cancelAnimationFrame(this.frame); this.frame = 0; this.resize.disconnect();
    this.observed.clear();
    clearTimeout(this.pendingFeedback);
    this.root.removeEventListener('scroll', this.schedule, true);
    this.root.ownerDocument.defaultView?.removeEventListener('resize', this.invalidateGeometry);
    this.root.ownerDocument.fonts.removeEventListener('loadingdone', this.invalidateGeometry);
    this.ranges.dispose(); this.clearHighlights(); this.style.remove(); this.sources = []; this.matches = []; this.inputs = undefined;
  }
}
