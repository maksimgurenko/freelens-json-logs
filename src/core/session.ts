import { containerChoices, initialContainer, type Container, type LogTarget, type PodDescription } from './target.ts';
import { retainSnapshot, type LogSnapshot } from './snapshot.ts';
import { LogRequests, systemClock, type Clock } from './requests.ts';

export const REFRESH_DELAY = 3_000;
export const SLOW_DELAY = 15_000;

/** Host operations enter here; state and stale-result decisions remain host-independent. */
export interface SnapshotPort {
  loadPod(target: LogTarget): Promise<PodDescription | null>;
  readLogs(target: LogTarget, container: string): Promise<string>;
  watchPod?(target: LogTarget, observed: (pod: PodDescription | null) => void,
    failed: (error: unknown) => void): () => void;
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
  gone: boolean;
  manualProfile?: string;
  lifecycleNotice?: string;
}
export class SnapshotSession {
  private generation = 0;
  private active = true;
  private cancelAutomatic?: () => void;
  private cancelSlow?: () => void;
  private work?: { generation: number; promise: Promise<void> };
  private stopWatching?: () => void;
  private pod?: PodDescription;
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
      paused: false, refreshing: false, waiting: false, slow: false, outdated: false, gone: false };
  }
  private update(change: Partial<SnapshotState>) {
    this.state = { ...this.state, ...change };
    this.changed(this.state);
  }
  async open() {
    if (this.state.phase === 'closed' || this.state.gone) return;
    const generation = this.invalidate();
    this.update({ phase: 'loading-pod', snapshot: undefined, error: undefined });
    try {
      const pod = await this.port.loadPod(this.state.target);
      if (!this.eligible(generation)) return;
      if (!pod || pod.uid !== this.state.target.podUid) { this.observePod(pod); return; }
      this.pod = pod;
      const container = initialContainer(pod);
      this.update({ containers: containerChoices(pod), container, phase: container ? 'loading-logs' : 'choose-container' });
      this.watch();
      if (container) await this.selectContainer(container);
    } catch (error) {
      if (this.eligible(generation)) this.update({ phase: 'error', error: describeError(error) });
    }
  }
  async selectContainer(container: string) {
    if (this.state.phase === 'closed' || this.state.gone || !this.state.containers.some(item => item.name === container)) return;
    if (container === this.state.container && this.work?.generation === this.generation) return this.work.promise;
    this.invalidate();
    this.update({ container, phase: 'loading-logs', snapshot: undefined, error: undefined,
      paused: false, outdated: false, refreshing: false, waiting: false, slow: false,
      manualProfile: undefined, lifecycleNotice: undefined });
    await this.refresh();
  }
  private invalidate() {
    this.cancelAutomatic?.(); this.cancelAutomatic = undefined;
    this.cancelSlow?.(); this.cancelSlow = undefined;
    return ++this.generation;
  }
  private eligible(generation: number) {
    return this.active && !this.state.gone && this.state.phase !== 'closed' && generation === this.generation;
  }
  /** Repeated actions share one intent; an invalidated host result is only awaited,
   * never accepted. A different target has a separate outstanding-operation slot. */
  refresh(): Promise<void> {
    if (!this.active || this.state.gone || this.state.phase === 'closed') return Promise.resolve();
    if (!this.state.container) return this.state.phase === 'error' ? this.open() : Promise.resolve();
    if (this.work?.generation === this.generation) return this.work.promise;
    this.cancelAutomatic?.(); this.cancelAutomatic = undefined;
    const generation = this.generation;
    const promise = this.read(generation);
    this.work = { generation, promise };
    void promise.then(() => { if (this.work?.promise === promise) this.work = undefined; });
    return promise;
  }
  retry() { this.watch(); return this.refresh(); }
  selectProfile(profile?: string) {
    if (this.state.phase !== 'closed') this.update({ manualProfile: profile });
  }
  private watch() {
    if (!this.active || this.stopWatching || this.state.gone || this.state.phase === 'closed') return;
    this.stopWatching = this.port.watchPod?.(this.state.target, pod => this.observePod(pod), error => {
      this.invalidate();
      this.stopWatching?.(); this.stopWatching = undefined;
      this.update({ phase: 'error', error: describeError(error), outdated: !!this.state.snapshot,
        refreshing: false, waiting: false, slow: false });
    });
  }
  /** Observations are not an atomic UID-bound log read. Missing status is not a restart. */
  observePod(pod: PodDescription | null) {
    if (!this.active || this.state.phase === 'closed' || this.state.gone) return;
    if (!pod || pod.uid !== this.state.target.podUid) {
      this.invalidate();
      this.stopWatching?.(); this.stopWatching = undefined;
      this.update({ gone: true, phase: 'error', outdated: !!this.state.snapshot,
        error: 'The original Pod is gone or has been replaced. Reopen Readable logs from the current Pod.',
        refreshing: false, waiting: false, slow: false });
      return;
    }
    const before = this.pod?.instances?.[this.state.container];
    const after = pod.instances?.[this.state.container];
    // Retain known instance IDs through temporarily incomplete status observations.
    const instances = { ...this.pod?.instances };
    for (const [name, instance] of Object.entries(pod.instances ?? {})) {
      instances[name] = { ...instance, id: instance.id || (instances[name]?.restarts === instance.restarts ? instances[name]?.id : undefined) };
    }
    this.pod = { ...pod, instances };
    if (before && after && (before.restarts !== after.restarts || (before.id && after.id && before.id !== after.id))) {
      this.invalidate();
      this.update({ snapshot: undefined, error: undefined, outdated: false,
        phase: 'loading-logs', refreshing: false, waiting: false, slow: false,
        lifecycleNotice: 'Container restart observed. Previous-instance logs were cleared.' });
      if (!this.state.paused) void this.refresh();
    }
    this.update({ containers: containerChoices(pod) });
  }
  pause() {
    if (this.state.phase === 'closed' || this.state.gone) return;
    this.invalidate();
    this.update({ paused: true, refreshing: false, waiting: false, slow: false,
      phase: this.state.snapshot ? 'ready' : this.state.phase });
  }
  resume() {
    if (this.state.phase === 'closed' || this.state.gone) return Promise.resolve();
    this.invalidate();
    this.update({ paused: false, refreshing: false, waiting: false, slow: false });
    return this.refresh();
  }
  /** Adapter lifecycle observations can suspend a view without treating blur as departure. */
  setActive(active: boolean) {
    if (this.active === active || this.state.phase === 'closed') return;
    this.active = active;
    this.invalidate();
    this.stopWatching?.(); this.stopWatching = undefined;
    this.update({ refreshing: false, waiting: false, slow: false });
    if (active) {
      this.watch();
      if (!this.pod && !this.state.gone && !this.state.error) void this.open();
      else if (!this.state.paused && !this.state.error) void this.refresh();
    }
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
    this.stopWatching?.(); this.stopWatching = undefined;
    this.update({ phase: 'closed', snapshot: undefined, error: undefined,
      refreshing: false, waiting: false, slow: false, outdated: false, paused: false,
      manualProfile: undefined, lifecycleNotice: undefined });
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
