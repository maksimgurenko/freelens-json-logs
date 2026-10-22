import { containerChoices, initialContainer, type Container, type LogTarget, type PodDescription } from './target.ts';
import { retainSnapshot, type LogSnapshot } from './snapshot.ts';

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
}
export class SnapshotSession {
  private generation = 0;
  state: SnapshotState;
  private port: SnapshotPort;
  private changed: (state: SnapshotState) => void;
  constructor(target: LogTarget, port: SnapshotPort, changed: (state: SnapshotState) => void) {
    this.port = port;
    this.changed = changed;
    this.state = { target, containers: [], container: '', phase: 'loading-pod' };
  }
  private update(change: Partial<SnapshotState>) {
    this.state = { ...this.state, ...change };
    this.changed(this.state);
  }
  async open() {
    const generation = ++this.generation;
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
    const generation = ++this.generation;
    this.update({ container, phase: 'loading-logs', snapshot: undefined, error: undefined });
    try {
      const response = await this.port.readLogs(this.state.target, container);
      if (generation === this.generation) this.update({ phase: 'ready', snapshot: retainSnapshot(response) });
    } catch (error) {
      if (generation === this.generation) this.update({ phase: 'error', error: describeError(error) });
    }
  }
  dispose() {
    this.generation++;
    this.update({ phase: 'closed', snapshot: undefined });
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
  return 'The log request failed. Reopen Readable logs to try again.';
}
