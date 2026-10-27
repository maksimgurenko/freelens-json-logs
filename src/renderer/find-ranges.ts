import { FIND_TIMEOUT_MS, hasFindReplyIdentity, isFindReply, sameFindKey, sameRecordRef, type FindScope, type FindReply } from '../core/find-protocol.ts';
import { FindClient, type FindInputs } from './find-client.ts';
import type { FindClock } from '../main/find-execution.ts';

export interface RangeState {
  phase: 'empty' | 'pending' | 'ready' | 'failed';
  ranges: readonly FindScope[];
  complete: boolean;
}

/** Decoration has its own interest, deadline and failure latch. It is called
 * only after exact matching; it cannot publish counts or selection intents.
 */
export class FindRanges {
  state: RangeState = { phase: 'empty', ranges: [], complete: true };
  private client: FindClient;
  private changed: (state: RangeState) => void;
  private inputs?: FindInputs;
  private scopes: readonly FindScope[] = [];
  private coveredInterest?: readonly FindScope[];
  private presentation = -1;
  private interest = 0;
  private stopDeadline: () => void = () => {};
  private clock: FindClock;
  private failedQuery?: number;
  private queryRevision?: number;
  private closed = false;
  constructor(client: FindClient, changed: (state: RangeState) => void, clock: FindClock = {
    now: () => performance.now(), delay: (ms, run) => { const timer = setTimeout(run, ms); return () => clearTimeout(timer); },
  }) { this.client = client; this.changed = changed; this.clock = clock; }
  update(inputs: FindInputs, scopes: readonly FindScope[], presentation: number) {
    if (this.closed) return;
    if (this.inputs && sameFindKey(this.inputs.key, inputs.key) && presentation === this.presentation) {
      if (JSON.stringify(scopes) === JSON.stringify(this.scopes)) {
        this.coveredInterest = undefined; return;
      }
      // Pending feedback can shrink the clip, then completion expands it again.
      // Keep an attempt that already covers that text instead of canceling it
      // in response to its own feedback. Incomplete replies cannot cover a new
      // interest: later visible hits must still be able to request their ranges.
      if (scopes.length && (this.state.phase === 'pending' || this.state.phase === 'ready' && this.state.complete) &&
        scopes.every(scope => this.scopes.some(previous => sameRecordRef(previous.ref, scope.ref) && previous.source === scope.source &&
          previous.start <= scope.start && previous.end >= scope.end))) {
        if (this.state.phase === 'pending') this.coveredInterest = scopes;
        return;
      }
    }
    if (inputs.key.queryRevision !== this.queryRevision) this.failedQuery = undefined;
    this.queryRevision = inputs.key.queryRevision;
    this.stop(); this.inputs = inputs; this.scopes = scopes; this.presentation = presentation;
    if (this.failedQuery !== undefined) this.publish('failed'); else this.start();
  }
  retry() { if (this.closed) return; this.failedQuery = undefined; this.stop(); this.start(); }
  clear() { this.stop(); this.inputs = undefined; this.scopes = []; this.presentation = -1; this.publish('empty'); }
  dispose() { this.closed = true; this.stop(); this.inputs = undefined; this.scopes = []; }
  private publish(phase: RangeState['phase'], ranges: readonly FindScope[] = [], complete = phase === 'empty') {
    this.state = { phase, ranges, complete }; this.changed(this.state);
  }
  private stop() { this.interest++; this.coveredInterest = undefined; this.stopDeadline(); this.stopDeadline = () => {}; this.client.cancelRanges(); }
  private fail() { this.stop(); this.failedQuery = this.inputs?.key.queryRevision; this.publish('failed'); }
  private start() {
    if (!this.inputs || !this.scopes.length || !this.inputs.query.text) { this.publish('empty'); return; }
    const inputs = this.inputs, presentation = this.presentation;
    const interest = ++this.interest, started = this.clock.now();
    const request = { ...this.inputs, requestId: this.client.nextRequestId(), work: 'ranges' as const,
      rangeInterest: { id: interest, scopes: this.scopes } };
    this.publish('pending');
    this.stopDeadline = this.clock.delay(FIND_TIMEOUT_MS, () => { if (this.interest === interest) this.fail(); });
    void this.client.submit(request).then(value => {
      if (this.closed || this.interest !== interest) return;
      if (this.clock.now() - started >= FIND_TIMEOUT_MS) { this.fail(); return; }
      const generation = (value as FindReply | undefined)?.workerGeneration;
      if (!Number.isSafeInteger(generation) || generation! < 0) { this.fail(); return; }
      if (!hasFindReplyIdentity(value, request, generation!)) return;
      if (!isFindReply(value, request, generation!) || value.kind !== 'ranges') { this.fail(); return; }
      this.stopDeadline(); this.stopDeadline = () => {};
      const complete = value.coverage.every(entry => entry.complete), covered = this.coveredInterest;
      this.coveredInterest = undefined;
      this.publish('ready', value.ranges, complete);
      // A broad reply can be capped before the narrower interest requested
      // during pending feedback. Keep only that newest interest and request it
      // now; ready feedback need not cause another geometry event.
      if (!complete && covered && !this.closed && this.interest === interest) this.update(inputs, covered, presentation);
    }, () => { if (!this.closed && this.interest === interest) this.fail(); });
  }
}
