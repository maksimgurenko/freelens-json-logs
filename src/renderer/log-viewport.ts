import { emptyWindow, recordIndex, recordRef, type OccurrenceWindow, type RecordRef } from '../core/occurrences.ts';

export interface ViewportStatus { following: boolean; lost: boolean }

/** Own only the log scroller. Native browser anchoring is disabled on this surface.
 * Capture on user scroll, before a subsequent React commit replaces the rows.
 */
export class LogViewport {
  private window = emptyWindow('unopened');
  private anchor?: RecordRef;
  private offset = 0;
  private status: ViewportStatus = { following: true, lost: false };
  private appliedTop = 0;
  private appliedLeft = 0;
  private resize: ResizeObserver;
  private element: HTMLElement;
  private changed: (status: ViewportStatus) => void;

  constructor(element: HTMLElement, changed: (status: ViewportStatus) => void) {
    this.element = element;
    this.changed = changed;
    element.addEventListener('scroll', this.onScroll);
    this.resize = new ResizeObserver(() => this.restore());
    this.resize.observe(element);
  }
  dispose() { this.element.removeEventListener('scroll', this.onScroll); this.resize.disconnect(); }

  update(window: OccurrenceWindow) {
    const previousStatus = this.status;
    if (window !== this.window && !this.status.following && this.anchor) {
      if (recordIndex(window, this.anchor) < 0) this.status = { following: false, lost: true };
    }
    this.window = window;
    this.restore();
    if (previousStatus !== this.status) this.changed(this.status);
  }
  toBottom() { this.setStatus({ following: true, lost: false }); this.restore(); }
  show(ref: RecordRef) {
    const row = this.row(recordIndex(this.window, ref));
    if (!row) return;
    this.element.scrollTop += row.getBoundingClientRect().top - this.top();
    this.capture(true);
  }
  private row(index: number) { return this.element.querySelector<HTMLElement>(`[data-record-index="${index}"]`); }
  private top() { return this.element.getBoundingClientRect().top + this.element.clientTop; }
  private setStatus(status: ViewportStatus) {
    if (status.following !== this.status.following || status.lost !== this.status.lost) {
      this.status = status; this.changed(status);
    }
  }
  private onScroll = () => {
    // Programmatic restore scroll events arrive asynchronously. They must not
    // acknowledge a lost anchor or recapture a different record as its identity.
    if (this.element.scrollTop === this.appliedTop && this.element.scrollLeft === this.appliedLeft) return;
    this.capture(true);
  };
  private capture(user: boolean) {
    if (!this.element.clientHeight) return;
    const following = this.element.scrollHeight - this.element.clientHeight - this.element.scrollTop <= 2;
    const previousAnchor = this.anchor;
    this.anchor = undefined;
    const top = this.top();
    for (const row of Array.from(this.element.querySelectorAll<HTMLElement>('[data-record-index]'))) {
      const rect = row.getBoundingClientRect();
      if (rect.bottom > top) { this.anchor = recordRef(this.window, Number(row.dataset.recordIndex)); this.offset = rect.top - top; break; }
    }
    this.appliedTop = this.element.scrollTop;
    this.appliedLeft = this.element.scrollLeft;
    if (this.status.lost && !user) this.anchor = previousAnchor;
    // React 17 may synchronously render from this native scroll listener. Publish
    // only after the complete anchor/offset has been captured for that render.
    this.setStatus({ following: this.status.lost && !user ? false : following, lost: user ? false : this.status.lost });
  }
  private restore() {
    if (!this.element.clientHeight) return;
    if (this.status.following) this.element.scrollTop = this.element.scrollHeight;
    else if (!this.status.lost) {
      const row = this.row(recordIndex(this.window, this.anchor));
      if (row) this.element.scrollTop += row.getBoundingClientRect().top - this.top() - this.offset;
    }
    this.capture(false);
  }
}
