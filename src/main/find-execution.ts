import { FIND_TIMEOUT_MS, findRequestProblem, hasFindReplyIdentity, isFindReply, sameFindKey, sameRecordRef, type FindKey, type FindReply, type FindRequest } from '../core/find-protocol.ts';

export interface FindWorker {
  on(event: 'message', listener: (value: unknown) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  on(event: 'exit', listener: (code: number) => void): this;
  removeAllListeners(): this;
  postMessage(value: unknown): void;
  terminate(): Promise<number>;
}
export interface FindClock { now(): number; delay(ms: number, run: () => void): () => void }
interface Operation { request: FindRequest; started: number; stopTimer: () => void; resolve: (reply: FindReply | undefined) => void }
interface Pending { key: FindKey; match?: Operation; ranges?: Operation }
interface Slot { worker: FindWorker; generation: number; ready: boolean; stopping: boolean; exit: Promise<void> }

/** One viewer's main-owned execution. A worker's exit event, never termination's
 * returned Promise, is the authority for replacing or disposing that worker.
 */
export class FindExecution {
  private slot?: Slot;
  private generation = 0;
  private running?: Operation;
  // One logical input descriptor, with exact matching ahead of its newest
  // decoration interest. Both operations share the same immutable source array.
  private pending?: Pending;
  private closed = false;
  private active = true;
  private lastRequestId = 0;
  private factory: () => FindWorker;
  private version: string;
  private clock: FindClock;
  constructor(factory: () => FindWorker, version: string, clock: FindClock = {
    now: () => performance.now(), delay: (ms, run) => { const timer = setTimeout(run, ms); return () => clearTimeout(timer); },
  }) {
    this.factory = factory; this.version = version; this.clock = clock;
  }
  submit(request: FindRequest): Promise<FindReply | undefined> {
    const started = this.clock.now();
    if (this.closed || !this.active) return Promise.resolve(undefined);
    const problem = findRequestProblem(request);
    if (problem === 'invalid') throw new TypeError('Rejected invalid Find input');
    if (request.requestId <= this.lastRequestId) return Promise.resolve(undefined);
    this.lastRequestId = request.requestId;
    if (problem === 'too-long' || !request.query.text) {
      this.clearPending();
      if (this.running) { this.finish(this.running); void this.stop(); }
      const identity = { requestId: request.requestId, key: request.key, workerGeneration: this.generation };
      return Promise.resolve(problem === 'too-long' ? { ...identity, kind: 'failed', reason: 'too-long' }
        : request.work === 'match' ? { ...identity, kind: 'matches', records: [] }
          : { ...identity, kind: 'ranges', interestId: request.rangeInterest!.id, ranges: [],
            coverage: request.rangeInterest!.scopes.map(scope => ({ scope, complete: true })) });
    }
    const existing = this.pending?.match?.request ?? this.pending?.ranges?.request ?? this.running?.request;
    const sameInput = existing && sameFindKey(existing.key, request.key);
    if (sameInput) {
      if (existing.query.text !== request.query.text || existing.query.matchCase !== request.query.matchCase || existing.query.wholeWords !== request.query.wholeWords ||
        existing.records.length !== request.records.length || !existing.records.every((record, index) => sameRecordRef(record.ref, request.records[index].ref) &&
          record.application === request.records[index].application && record.message === request.records[index].message)) throw new TypeError('Find inputs changed without a new key');
      request = { ...request, query: existing.query, records: existing.records };
    } else this.clearPending();
    return new Promise(resolve => {
      const older = this.pending?.[request.work];
      if (older) this.finish(older);
      const operation: Operation = { request, resolve, started, stopTimer: () => {} };
      this.pending ??= { key: request.key };
      this.pending[request.work] = operation;
      // Supervision starts before any startup/posting and is never renewed.
      operation.stopTimer = this.clock.delay(Math.max(0, FIND_TIMEOUT_MS - (this.clock.now() - started)), () => this.timeout(operation));
      if (this.running && (!sameInput || request.work === 'match' || this.running.request.work === 'ranges')) {
        this.finish(this.running);
        void this.stop();
      }
      this.pump();
    });
  }
  private pump() {
    if (this.closed || !this.active || this.running || this.slot?.stopping || !this.pending) return;
    this.running = this.pending.match ?? this.pending.ranges;
    if (!this.running) return;
    delete this.pending[this.running.request.work];
    if (!this.pending.match && !this.pending.ranges) this.pending = undefined;
    if (this.clock.now() - this.running.started >= FIND_TIMEOUT_MS) { this.timeout(this.running); return; }
    try { if (!this.slot) this.create(); }
    catch { this.fail('execution'); return; }
    if (this.slot?.ready) this.post();
  }
  private create() {
    const worker = this.factory();
    let exited!: () => void;
    const slot: Slot = { worker, generation: ++this.generation, ready: false, stopping: false,
      exit: new Promise(resolve => { exited = resolve; }) };
    this.slot = slot;
    worker.on('message', value => {
      if (this.slot !== slot || slot.stopping) return;
      if (!slot.ready) {
        if (typeof value === 'object' && value !== null && 'kind' in value && value.kind === 'ready' && 'version' in value && value.version === this.version) {
          slot.ready = true; this.post();
        } else this.fail('execution');
        return;
      }
      const operation = this.running;
      if (!operation || !hasFindReplyIdentity(value, operation.request, slot.generation)) return;
      if (this.clock.now() - operation.started >= FIND_TIMEOUT_MS) { this.timeout(operation); return; }
      if (isFindReply(value, operation.request, slot.generation)) {
        if (value.kind === 'failed') {
          this.finishFailed(operation, value);
          void this.stop();
        } else { this.finish(operation, value); this.pump(); }
      } else this.fail('execution');
    });
    worker.on('error', () => this.fail('execution'));
    worker.on('exit', () => {
      if (this.slot === slot) { this.slot = undefined; this.fail('execution'); }
      worker.removeAllListeners(); exited(); this.pump();
    });
  }
  private post() {
    if (!this.slot?.ready || this.slot.stopping || !this.running) return;
    if (this.clock.now() - this.running.started >= FIND_TIMEOUT_MS) { this.timeout(this.running); return; }
    try { this.slot.worker.postMessage({ request: this.running.request, workerGeneration: this.slot.generation }); }
    catch { this.fail('execution'); }
  }
  private finish(operation: Operation, reply?: FindReply) {
    operation.stopTimer();
    if (this.running === operation) this.running = undefined;
    if (this.pending?.[operation.request.work] === operation) {
      delete this.pending[operation.request.work];
      if (!this.pending.match && !this.pending.ranges) this.pending = undefined;
    }
    operation.resolve(reply);
  }
  private failure(operation: Operation, reason: 'timeout' | 'execution'): FindReply {
    return { requestId: operation.request.requestId, key: operation.request.key, workerGeneration: this.generation, kind: 'failed', reason };
  }
  private finishFailed(operation: Operation, reply: FindReply) {
    if (operation.request.work === 'match' && this.pending?.ranges) this.finish(this.pending.ranges);
    this.finish(operation, reply);
  }
  private timeout(operation: Operation) {
    const running = this.running === operation;
    if (!running && this.pending?.[operation.request.work] !== operation) return;
    this.finishFailed(operation, this.failure(operation, 'timeout'));
    if (running) void this.stop();
  }
  private fail(reason: 'execution') {
    if (this.running) this.finishFailed(this.running, this.failure(this.running, reason));
    void this.stop();
  }
  private clearPending() {
    if (this.pending?.match) this.finish(this.pending.match);
    if (this.pending?.ranges) this.finish(this.pending.ranges);
  }
  private stop(): Promise<void> {
    const slot = this.slot;
    if (!slot) return Promise.resolve();
    if (!slot.stopping) { slot.stopping = true; void slot.worker.terminate().catch(() => {}); }
    return slot.exit;
  }
  async setActive(active: boolean): Promise<void> {
    if (this.closed) return;
    this.active = active;
    if (!active) await this.cancel();
  }
  async cancel(): Promise<void> {
    this.clearPending();
    if (this.running) { this.finish(this.running); await this.stop(); }
    else if (!this.active || this.closed || this.slot?.stopping) await this.stop();
  }
  async dispose(): Promise<void> {
    this.closed = true;
    await this.cancel();
    await this.stop();
  }
}
