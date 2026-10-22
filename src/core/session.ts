import { containerChoices, initialContainer, type Container, type LogTarget, type PodDescription } from './target.ts';
import { retainSnapshot, type LogSnapshot } from './snapshot.ts';
import { LogRequests, systemClock, type Clock } from './requests.ts';

export const REFRESH_DELAY = 3_000;
export const SLOW_DELAY = 15_000;

/** Host operations enter here; state and stale-result decisions remain host-independent. */
export interface SnapshotPort {
  loadPod(target: LogTarget): Promise<PodDescription>;
  readLogs(target: LogTarget, container: string): Promise<string>;
}
export interface SnapshotState {
  target: LogTarget;
  containers: Container[];
  container: string;
  phase: 'loading-pod' | 'choose-container' | 'loading-logs' | 'ready' | 'error' | 'closed';
  snapshot?: LogSnapshot;
  error?: string;
  paused: boolean;
  refreshing: boolean;
  waiting: boolean;
  slow: boolean;
  outdated: boolean;
}
export class SnapshotSession {
  private generation = 0;
  private active = true;
  private cancelAutomatic?: () => void;
  private cancelSlow?: () => void;
  private work?: { generation: number; promise: Promise<void> };
  state: SnapshotState;
  private port: SnapshotPort;
  private changed: (state: SnapshotState) => void;
  private requests: LogRequests;
  private clock: Clock;
  constructor(target: LogTarget, port: SnapshotPort, changed: (state: SnapshotState) => void,
    requests = new LogRequests(), clock: Clock = systemClock) {
    this.port = port;
    this.changed = changed;
    this.requests = requests;
    this.clock = clock;
    this.state = { target, containers: [], container: '', phase: 'loading-pod',
      paused: false, refreshing: false, waiting: false, slow: false, outdated: false };
  }
  private update(change: Partial<SnapshotState>) {
    this.state = { ...this.state, ...change };
    this.changed(this.state);
  }
  async open() {
    if (this.state.phase === 'closed') return;
    const generation = this.invalidate();
    this.update({ phase: 'loading-pod', snapshot: undefined, error: undefined });
    try {
      const pod = await this.port.loadPod(this.state.target);
      if (generation !== this.generation) return;
      if (pod.uid !== this.state.target.podUid) throw new Error('The original Pod is gone or has been replaced. Reopen Readable logs from the current Pod.');
      const container = initialContainer(pod);
      this.update({ containers: containerChoices(pod), container, phase: container ? 'loading-logs' : 'choose-container' });
      if (container) await this.selectContainer(container);
    } catch (error) {
      if (generation === this.generation) this.update({ phase: 'error', error: describeError(error) });
    }
  }
  async selectContainer(container: string) {
    if (this.state.phase === 'closed' || !this.state.containers.some(item => item.name === container)) return;
    if (container === this.state.container && this.work?.generation === this.generation) return this.work.promise;
    this.invalidate();
    this.update({ container, phase: 'loading-logs', snapshot: undefined, error: undefined,
      paused: false, outdated: false, refreshing: false, waiting: false, slow: false });
    await this.refresh();
  }
  private invalidate() {
    this.cancelAutomatic?.(); this.cancelAutomatic = undefined;
    this.cancelSlow?.(); this.cancelSlow = undefined;
    return ++this.generation;
  }
  private eligible(generation: number) {
    return this.active && this.state.phase !== 'closed' && generation === this.generation;
  }
  /** Repeated actions share one intent; an invalidated host result is only awaited,
   * never accepted. A different target has a separate outstanding-operation slot. */
  refresh(): Promise<void> {
    if (!this.active || this.state.phase === 'closed') return Promise.resolve();
    if (!this.state.container) return this.state.phase === 'error' ? this.open() : Promise.resolve();
    if (this.work?.generation === this.generation) return this.work.promise;
    this.cancelAutomatic?.(); this.cancelAutomatic = undefined;
    const generation = this.generation;
    const promise = this.read(generation);
    this.work = { generation, promise };
    void promise.then(() => { if (this.work?.promise === promise) this.work = undefined; });
    return promise;
  }
  retry() { return this.refresh(); }
  pause() {
    if (this.state.phase === 'closed') return;
    this.invalidate();
    this.update({ paused: true, refreshing: false, waiting: false, slow: false,
      phase: this.state.snapshot ? 'ready' : this.state.phase });
  }
  resume() {
    if (this.state.phase === 'closed') return Promise.resolve();
    this.invalidate();
    this.update({ paused: false, refreshing: false, waiting: false, slow: false });
    return this.refresh();
  }
  /** Adapter lifecycle observations can suspend a view without treating blur as departure. */
  setActive(active: boolean) {
    if (this.active === active || this.state.phase === 'closed') return;
    this.active = active;
    this.invalidate();
    this.update({ refreshing: false, waiting: false, slow: false });
    if (active && !this.state.paused && !this.state.error) void this.refresh();
  }
  private watchSlow(startedAt: number, generation: number) {
    this.cancelSlow?.();
    this.cancelSlow = this.clock.schedule(Math.max(0, SLOW_DELAY - (this.clock.now() - startedAt)), () => {
      if (this.eligible(generation)) this.update({ slow: true });
    });
  }
  private async read(generation: number) {
    const { target, container } = this.state;
    const key = JSON.stringify([target.clusterId, target.namespace, target.podName, target.podUid, container]);
    let outstanding = this.requests.outstanding(key);
    while (outstanding) {
      this.update({ waiting: true, refreshing: false, slow: false });
      this.watchSlow(outstanding.startedAt, generation);
      try { await outstanding.promise; } catch { /* Invalidated or another view's result. */ }
      if (!this.eligible(generation)) return;
      outstanding = this.requests.outstanding(key);
    }
    if (!this.eligible(generation)) return;
    const operation = this.requests.start(key, () => this.port.readLogs(target, container), this.clock.now());
    this.update({ phase: this.state.snapshot ? 'ready' : 'loading-logs', refreshing: true, waiting: false, slow: false });
    this.watchSlow(operation.startedAt, generation);
    try {
      const response = await operation.promise;
      if (!this.eligible(generation)) return;
      this.update({ phase: 'ready', snapshot: retainSnapshot(response), error: undefined, outdated: false });
    } catch (error) {
      if (!this.eligible(generation)) return;
      this.update({ phase: 'error', error: describeError(error), outdated: !!this.state.snapshot });
    } finally {
      if (this.eligible(generation)) {
        this.cancelSlow?.(); this.cancelSlow = undefined;
        this.update({ refreshing: false, waiting: false, slow: false });
        if (!this.state.paused && !this.state.error) {
          this.cancelAutomatic = this.clock.schedule(REFRESH_DELAY, () => {
            this.cancelAutomatic = undefined;
            if (this.eligible(generation)) void this.refresh();
          });
        }
      }
    }
  }
  dispose() {
    this.invalidate();
    this.update({ phase: 'closed', snapshot: undefined, error: undefined,
      refreshing: false, waiting: false, slow: false, outdated: false });
  }
}

/** Freelens can reject with a raw Kubernetes Status or a parsed error wrapper. */
export function describeError(error: unknown): string {
  if (typeof error === 'string' && error) return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const value = error as Record<string, unknown>;
    if (typeof value.message === 'string' && value.message) return value.message;
    if (Array.isArray(value.messages) && value.messages.length) return value.messages.map(describeError).join('\n');
    for (const key of ['error', 'body', 'status']) {
      if (value[key] && typeof value[key] === 'object') return describeError(value[key]);
    }
    try { return JSON.stringify(value); } catch { /* Use a useful fallback for cyclic host errors. */ }
  }
  return 'The log request failed. Select Retry to try again.';
}
