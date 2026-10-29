import { FIND_CONTROL, FIND_OPEN, FIND_REQUEST, type FindRpc } from '../adapter/find-ipc.ts';
import { FIND_PENDING_MS, FIND_QUERY_LIMIT, FIND_TIMEOUT_MS, hasFindReplyIdentity, isFindReply, sameFindKey,
  type FindKey, type FindQuery, type FindRecord, type FindReply, type FindRequest, type MatchingRecord } from '../core/find-protocol.ts';
import type { FindClock } from '../main/find-execution.ts';

/** One SDK owner for this mounted viewer. Cancellation also invalidates calls
 * still waiting for registration; they cannot dispatch later on return.
 */
export class FindClient {
  private rpc: FindRpc;
  private viewer: string;
  private owner?: Promise<string>;
  private revision = 0;
  private active = true;
  private closed = false;
  private closing?: Promise<void>;
  private requestId = 0;
  private work?: FindRequest['work'];
  constructor(rpc: FindRpc, viewer: string) { this.rpc = rpc; this.viewer = viewer; }
  nextRequestId() { return ++this.requestId; }
  private token(): Promise<string> {
    this.owner ??= this.rpc.invoke(FIND_OPEN, this.viewer).then(value => {
      if (typeof value !== 'string' || !value || value.length > 128) throw new Error('Invalid Find registration');
      return value;
    }).catch(error => { this.owner = undefined; throw error; });
    return this.owner;
  }
  async submit(request: FindRequest): Promise<unknown> {
    if (this.closed || !this.active) return;
    this.work = request.work;
    const revision = this.revision, token = await this.token();
    if (this.closed || !this.active || revision !== this.revision) return;
    const value = await this.rpc.invoke(FIND_REQUEST, token, request);
    return !this.closed && this.active && revision === this.revision ? value : undefined;
  }
  private control(action: string, active?: boolean): Promise<void> {
    return this.owner ? this.owner.then(async token => { await this.rpc.invoke(FIND_CONTROL, token, action, active); }).catch(() => {}) : Promise.resolve();
  }
  cancel() { this.revision++; this.work = undefined; void this.control('cancel'); }
  cancelRanges() { if (this.work === 'ranges') this.cancel(); }
  setActive(active: boolean) {
    if (this.closed || this.active === active) return;
    this.active = active;
    if (!active) this.revision++;
    void this.control('active', active);
  }
  dispose(): Promise<void> {
    if (this.closing) return this.closing;
    this.closed = true; this.revision++;
    return this.closing = this.control('close');
  }
}

export interface FindInputs { key: FindKey; query: FindQuery; records: readonly FindRecord[] }
export interface FindMatchingState {
  phase: 'empty' | 'pending' | 'ready' | 'too-long' | 'timeout' | 'execution';
  searching: boolean;
  key?: FindKey;
  records: readonly MatchingRecord[];
  /** Pending maintenance can retain confirmed membership on unchanged sources.
   * It is incomplete until ready and never enables navigation. */
  retained?: boolean;
}
interface Attempt { request: FindRequest; started: number; stopFeedback: () => void; stopDeadline: () => void }

/** Exact matching data only. Reading/selection/reveal permissions belong to the
 * viewer; successful matching is never an implicit authorization to scroll.
 */
export class FindMatching {
  state: FindMatchingState = { phase: 'empty', searching: false, records: [] };
  private client: FindClient;
  private changed: (state: FindMatchingState) => void;
  private clock: FindClock;
  private inputs?: FindInputs;
  private composing = false;
  private attempt?: Attempt;
  private active = true;
  private closed = false;
  constructor(client: FindClient, changed: (state: FindMatchingState) => void, clock: FindClock = {
    now: () => performance.now(), delay: (ms, run) => { const timer = setTimeout(run, ms); return () => clearTimeout(timer); },
  }) { this.client = client; this.changed = changed; this.clock = clock; }
  knownMatches(inputs: FindInputs): readonly MatchingRecord[] | undefined {
    const previous = this.inputs;
    if (!previous || !(this.state.phase === 'ready' || this.state.phase === 'pending' && this.state.retained)) return;
    if (sameFindKey(previous.key, inputs.key)) return this.state.records;
    if (previous.key.viewerEpoch !== inputs.key.viewerEpoch || previous.key.targetEpoch !== inputs.key.targetEpoch ||
      previous.key.instanceEpoch !== inputs.key.instanceEpoch || previous.key.queryRevision !== inputs.key.queryRevision ||
      previous.query.text !== inputs.query.text || previous.query.matchCase !== inputs.query.matchCase ||
      previous.query.wholeWords !== inputs.query.wholeWords) return;
    const old = new Map(previous.records.map(record => [JSON.stringify(record.ref), record]));
    const current = new Map(inputs.records.map(record => [JSON.stringify(record.ref), record]));
    return this.state.records.filter(match => {
      const key = JSON.stringify(match.ref), before = old.get(key), after = current.get(key);
      return before && after && before.application === after.application && before.message === after.message;
    });
  }
  update(inputs: FindInputs, reason: 'edit' | 'maintenance' | 'retry') {
    if (this.closed) return;
    if (reason === 'maintenance' && this.inputs && sameFindKey(this.inputs.key, inputs.key)) return;
    const retained = reason === 'maintenance' ? this.knownMatches(inputs) : undefined;
    this.inputs = inputs;
    this.stop();
    if (!inputs.query.text) { this.publish('empty'); return; }
    if (inputs.query.text.length > FIND_QUERY_LIMIT) { this.publish('too-long'); return; }
    if (reason === 'maintenance' && ['timeout', 'execution'].includes(this.state.phase)) {
      this.publish(this.state.phase); return;
    }
    this.publish('pending', retained ?? [], false, retained !== undefined);
    if (this.active && !this.composing) this.start();
  }
  private publish(phase: FindMatchingState['phase'], records: readonly MatchingRecord[] = [], searching = false, retained = false) {
    this.state = { phase, records, searching, retained, key: this.inputs?.key }; this.changed(this.state);
  }
  private start() {
    if (!this.inputs || this.closed || !this.active) return;
    const request: FindRequest = { ...this.inputs, requestId: this.client.nextRequestId(), work: 'match' };
    const attempt: Attempt = { request, started: this.clock.now(), stopFeedback: () => {}, stopDeadline: () => {} };
    this.attempt = attempt;
    // Both timers precede registration/dispatch. Callback lateness does not let
    // a completion beyond the whole-attempt deadline through.
    attempt.stopFeedback = this.clock.delay(FIND_PENDING_MS, () => {
      if (this.attempt === attempt) this.publish('pending', this.state.records, true, this.state.retained);
    });
    attempt.stopDeadline = this.clock.delay(FIND_TIMEOUT_MS, () => { if (this.attempt === attempt) this.fail('timeout'); });
    void this.client.submit(request).then(value => {
      if (this.attempt !== attempt || !this.inputs || !sameFindKey(request.key, this.inputs.key)) return;
      if (this.clock.now() - attempt.started >= FIND_TIMEOUT_MS) { this.fail('timeout'); return; }
      const generation = (value as FindReply | undefined)?.workerGeneration;
      if (!Number.isSafeInteger(generation) || generation! < 0) { this.fail('execution'); return; }
      if (!hasFindReplyIdentity(value, request, generation!)) return;
      if (!isFindReply(value, request, generation!) || (value.kind !== 'matches' && value.kind !== 'failed')) { this.fail('execution'); return; }
      if (value.kind === 'failed') this.fail(value.reason);
      else { this.finish(); this.publish('ready', value.records); }
    }, () => { if (this.attempt === attempt) this.fail('execution'); });
  }
  private finish() {
    this.attempt?.stopFeedback(); this.attempt?.stopDeadline(); this.attempt = undefined;
  }
  private stop() { this.finish(); this.client.cancel(); }
  private fail(phase: 'timeout' | 'execution' | 'too-long') { this.stop(); this.publish(phase); }
  setComposing(composing: boolean) {
    if (this.closed || this.composing === composing) return;
    this.composing = composing;
    if (composing) { this.stop(); this.publish(this.inputs?.query.text ? 'pending' : 'empty'); }
  }
  setActive(active: boolean) {
    if (this.closed || this.active === active) return;
    this.active = active;
    this.client.setActive(active);
    if (!active) this.finish();
    else if (this.state.phase === 'pending' && !this.composing) { this.publish('pending', this.state.records, false, this.state.retained); this.start(); }
  }
  dispose(): Promise<void> { this.closed = true; this.finish(); this.inputs = undefined; return this.client.dispose(); }
}
