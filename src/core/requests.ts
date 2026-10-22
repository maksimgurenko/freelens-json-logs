export interface Clock {
  now(): number;
  schedule(delay: number, callback: () => void): () => void;
}
export const systemClock: Clock = {
  now: () => Date.now(),
  schedule(delay, callback) {
    const timer = setTimeout(callback, delay);
    return () => clearTimeout(timer);
  },
};

interface Outstanding { promise: Promise<string>; startedAt: number }

/** Shared across views, including departed views whose host reads cannot be cancelled.
 * This pool holds only outstanding operations, never a cache of accepted log data. */
export class LogRequests {
  private requests = new Map<string, Outstanding>();
  outstanding(key: string) { return this.requests.get(key); }
  start(key: string, read: () => Promise<string>, startedAt: number): Outstanding {
    if (this.requests.has(key)) throw new Error('A log request for this target is already outstanding');
    // Invoke the port synchronously, but normalize synchronous throws as rejections.
    let promise: Promise<string>;
    try { promise = read(); } catch (error) { promise = Promise.reject(error); }
    const operation = { promise, startedAt };
    this.requests.set(key, operation);
    const release = () => { this.requests.delete(key); };
    void promise.then(release, release);
    return operation;
  }
}
