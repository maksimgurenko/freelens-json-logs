import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SnapshotSession, type SnapshotPort } from '../src/core/session.ts';
import { LogRequests, type Clock } from '../src/core/requests.ts';
import { observe } from '../src/core/observe.ts';
import { bindVisibility } from '../src/adapter/visibility.ts';
import type { LogTarget, PodDescription } from '../src/core/target.ts';

class FakeClock implements Clock {
  time = 0;
  jobs = new Set<{ at: number; run: () => void }>();
  now() { return this.time; }
  schedule(delay: number, run: () => void) {
    const job = { at: this.time + delay, run }; this.jobs.add(job);
    return () => { this.jobs.delete(job); };
  }
  tick(delay: number) {
    const end = this.time + delay;
    for (;;) {
      const job = [...this.jobs].filter(job => job.at <= end).sort((a, b) => a.at - b.at)[0];
      if (!job) break;
      this.time = job.at; this.jobs.delete(job); job.run();
    }
    this.time = end;
  }
}
function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const texts = (session: SnapshotSession) => session.state.snapshot?.records.map(r => r.applicationText);
const flush = async () => { for (let i = 0; i < 15; i++) await Promise.resolve(); };
const target: LogTarget = { clusterId: 'cluster', clusterName: 'Cluster', namespace: 'ns', podName: 'pod', podUid: 'uid' };
const pod: PodDescription = { uid: 'uid', regular: ['app', 'sidecar'], init: ['init'], ephemeral: ['debug'], instances: { app: { restarts: 0, id: 'run-0' } } };
function setup() {
  const clock = new FakeClock(), pool = new LogRequests();
  const reads: { target: LogTarget; container: string; response: ReturnType<typeof deferred<string>> }[] = [];
  const session = new SnapshotSession(target, { loadPod: async () => pod, readLogs(target, container) {
    const response = deferred<string>(); reads.push({ target, container, response }); return response.promise;
  } }, () => {}, pool, clock);
  return { clock, pool, session, reads };
}
for (const failure of [false, true]) {
  for (const paused of [false, true]) {
    test(`observed restart clears old window, preserves profile/${paused ? 'Pause' : 'Auto'} and rejects late ${failure ? 'failure' : 'success'}`, async t => {
      const h = setup(); t.after(() => h.session.dispose());
      void h.session.open(); await flush(); h.reads[0].response.resolve('old instance'); await flush();
      h.session.selectProfile('saved-profile');
      void h.session.refresh();
      if (paused) h.session.pause();
      h.session.observePod({ ...pod, instances: { app: { restarts: 1, id: 'run-1' } } });
      assert.equal(h.session.state.snapshot, undefined);
      assert.equal(h.session.state.manualProfile, 'saved-profile');
      assert.equal(h.session.state.paused, paused);
      assert.equal(h.reads.length, 2);
      if (!paused) assert(h.session.state.waiting);
      if (failure) h.reads[1].response.reject('pre-restart failure'); else h.reads[1].response.resolve('pre-restart output');
      await flush();
      assert.equal(h.session.state.snapshot, undefined); assert.equal(h.session.state.error, undefined);
      if (paused) { assert.equal(h.reads.length, 2); void h.session.refresh(); }
      assert.equal(h.reads.length, 3);
      h.reads[2].response.resolve('current instance'); await flush();
      assert.deepEqual(texts(h.session), ['current instance']);
      assert.equal(h.session.state.paused, paused);
    });
  }
  for (const observation of [null, { ...pod, uid: 'replacement' }]) {
    test(`${observation ? 'replacement' : 'deletion'} permanently stops original target and rejects late ${failure ? 'failure' : 'success'}`, async t => {
      const h = setup(); t.after(() => h.session.dispose());
      void h.session.open(); await flush(); h.reads[0].response.resolve('original UID'); await flush();
      const retained = h.session.state.snapshot;
      void h.session.refresh(); h.session.observePod(observation);
      assert(h.session.state.gone); assert(h.session.state.outdated);
      assert.equal(h.session.state.snapshot, retained); assert.equal(h.session.state.target.podUid, 'uid');
      if (failure) h.reads[1].response.reject('late replacement failure'); else h.reads[1].response.resolve('replacement records');
      await flush(); h.clock.tick(60_000);
      await h.session.retry(); await h.session.resume(); await h.session.selectContainer('sidecar');
      h.session.setActive(false); h.session.setActive(true); h.session.observePod(pod);
      assert(h.session.state.gone); assert.equal(h.reads.length, 2);
      assert.equal(h.session.state.snapshot, retained); assert.match(h.session.state.error!, /original Pod/);
    });
  }
}

test('all container kinds reset context to Auto/unpaused; old result is never reused', async t => {
  const h = setup(); t.after(() => h.session.dispose());
  void h.session.open(); await flush(); h.reads[0].response.resolve('app'); await flush();
  assert.deepEqual(h.session.state.containers.map(c => c.kind), ['regular', 'regular', 'init', 'ephemeral']);
  for (const container of ['sidecar', 'init', 'debug']) {
    h.session.pause(); h.session.selectProfile('manual');
    void h.session.selectContainer(container);
    assert.equal(h.session.state.snapshot, undefined); assert.equal(h.session.state.manualProfile, undefined);
    assert.equal(h.session.state.paused, false); assert.equal(h.reads.at(-1)?.container, container);
    h.reads.at(-1)!.response.resolve(container); await flush();
    assert.equal(texts(h.session)?.[0], container);
  }
});

test('instance ID changes detect restarts; absent/unchanged statuses and other containers do not', async t => {
  const h = setup(); t.after(() => h.session.dispose());
  void h.session.open(); await flush(); h.reads[0].response.resolve('old'); await flush(); h.session.pause();
  const retained = h.session.state.snapshot;
  h.session.observePod({ ...pod, instances: undefined });
  h.session.observePod({ ...pod, instances: { app: { restarts: 0 }, sidecar: { restarts: 4 } } });
  assert.equal(h.session.state.snapshot, retained);
  h.session.observePod({ ...pod, instances: { app: { restarts: 0, id: 'different' } } });
  assert.equal(h.session.state.snapshot, undefined); assert(h.session.state.paused);
});

for (const failure of [false, true]) {
  test(`initial metadata ${failure ? 'failure' : 'success'} after hiding is discarded; return starts fresh`, async t => {
    const metadata = deferred<PodDescription | null>(); let reads = 0, loads = 0;
    const session = new SnapshotSession(target, { loadPod: () => ++loads === 1 ? metadata.promise : Promise.resolve(pod),
      readLogs: async () => { reads++; return 'fresh'; } }, () => {});
    t.after(() => session.dispose());
    const opened = session.open(); session.setActive(false);
    if (failure) metadata.reject('late metadata denial'); else metadata.resolve(pod);
    await opened; assert.equal(reads, 0); assert.equal(session.state.error, undefined);
    session.setActive(true); await flush(); assert.equal(reads, 1);
    assert.equal(session.state.snapshot?.records[0].applicationText, 'fresh');
  });
}

test('hidden observer stops; paused return reobserves restart without reading logs; close/reopen resets state', async t => {
  const clock = new FakeClock(), pool = new LogRequests();
  let current = pod, observations = 0, reads = 0;
  const port: SnapshotPort = { loadPod: async () => current, readLogs: async () => { reads++; return 'output'; },
    watchPod: (_target, received, failed) => observe(async () => { observations++; return current; }, received, failed, clock) };
  const create = () => new SnapshotSession(target, port, () => {}, pool, clock);
  const session = create(); t.after(() => session.dispose());
  await session.open(); await flush(); session.pause(); session.selectProfile('manual');
  session.setActive(false); const before = observations; clock.tick(60_000); await flush(); assert.equal(observations, before);
  current = { ...pod, instances: { app: { restarts: 1 } } };
  session.setActive(true); await flush();
  assert.equal(reads, 1); assert.equal(session.state.snapshot, undefined); assert(session.state.paused);
  assert.equal(session.state.manualProfile, 'manual');
  session.dispose(); assert.equal(clock.jobs.size, 0); assert.equal(session.state.manualProfile, undefined);
  const reopened = create(); t.after(() => reopened.dispose()); await reopened.open();
  assert.equal(reads, 2); assert.equal(reopened.state.paused, false); assert.equal(reopened.state.manualProfile, undefined);
});

for (const failure of [false, true]) {
  test(`metadata poll never overlaps, and stop rejects late ${failure ? 'failure' : 'success'}`, async () => {
    const clock = new FakeClock(), response = deferred<PodDescription>();
    let reads = 0, accepted = 0, errors = 0;
    const stop = observe(() => { reads++; return response.promise; }, () => accepted++, () => errors++, clock);
    clock.tick(60_000); assert.equal(reads, 1); stop();
    if (failure) response.reject('late'); else response.resolve(pod);
    await flush(); clock.tick(60_000);
    assert.equal(accepted, 0); assert.equal(errors, 0); assert.equal(clock.jobs.size, 0);
  });
}

test('visibility ignores blur, combines hidden/minimized document and hidden cluster intersection, cleans up', () => {
  const document = new EventTarget() as EventTarget & { hidden: boolean };
  document.hidden = false;
  let report!: (entries: { isIntersecting: boolean }[]) => void;
  let disconnected = false;
  const original = globalThis.IntersectionObserver;
  globalThis.IntersectionObserver = class {
    constructor(callback: typeof report) { report = callback; }
    observe() {} disconnect() { disconnected = true; }
  } as unknown as typeof IntersectionObserver;
  try {
    const states: boolean[] = [];
    const element = { ownerDocument: document, getClientRects: () => [{}] } as unknown as HTMLElement;
    const stop = bindVisibility(element, active => states.push(active));
    document.dispatchEvent(new Event('blur')); assert.deepEqual(states, [true]);
    document.hidden = true; document.dispatchEvent(new Event('visibilitychange'));
    report([{ isIntersecting: true }]); assert.equal(states.at(-1), false);
    document.hidden = false; document.dispatchEvent(new Event('visibilitychange')); assert.equal(states.at(-1), true);
    report([{ isIntersecting: false }]); assert.equal(states.at(-1), false);
    report([{ isIntersecting: true }]); assert.equal(states.at(-1), true);
    stop(); const count = states.length; document.dispatchEvent(new Event('visibilitychange'));
    assert(disconnected); assert.equal(states.length, count);
  } finally { globalThis.IntersectionObserver = original; }
});

test('paused refresh after restart waits for the old outstanding read and fetches once', async t => {
  const h = setup(); t.after(() => h.session.dispose());
  void h.session.open(); await flush(); h.session.pause();
  h.session.observePod({ ...pod, instances: { app: { restarts: 1 } } });
  const refresh = h.session.refresh(); assert(h.session.state.waiting); assert.equal(h.reads.length, 1);
  h.reads[0].response.resolve('old run'); await flush(); assert.equal(h.reads.length, 2);
  assert.equal(h.session.state.snapshot, undefined);
  h.reads[1].response.resolve('new run'); await refresh;
  assert.deepEqual(texts(h.session), ['new run']); assert(h.session.state.paused);
  h.clock.tick(60_000); assert.equal(h.reads.length, 2);
});

test('inactive target change clears records/profile/Pause immediately and fetches only on return', async t => {
  const h = setup(); t.after(() => h.session.dispose());
  void h.session.open(); await flush(); h.reads[0].response.resolve('old'); await flush();
  h.session.pause(); h.session.selectProfile('manual'); h.session.setActive(false);
  await h.session.selectContainer('debug');
  assert.equal(h.session.state.snapshot, undefined); assert.equal(h.session.state.manualProfile, undefined);
  assert.equal(h.session.state.paused, false); assert.equal(h.reads.length, 1);
  h.session.setActive(true); assert.equal(h.reads.length, 2); assert.equal(h.reads[1].container, 'debug');
});

for (const changed of [{ clusterId: 'other-cluster' }, { podName: 'other-pod' }, { podUid: 'other-uid' }]) {
  test(`new view context ${Object.keys(changed)[0]} starts clean and independent of old late failure`, async t => {
    const h = setup(); t.after(() => h.session.dispose());
    void h.session.open(); await flush(); h.session.pause(); h.session.selectProfile('manual'); h.session.dispose();
    const identity = { ...target, ...changed }; let read = 0;
    const session = new SnapshotSession(identity, { loadPod: async () => ({ ...pod, uid: identity.podUid }),
      readLogs: async () => { read++; return 'new context'; } }, () => {}, h.pool, h.clock);
    t.after(() => session.dispose());
    await session.open(); h.reads[0].response.reject('old context'); await flush();
    assert.equal(read, 1); assert.equal(session.state.target, identity); assert.equal(session.state.manualProfile, undefined);
    assert.equal(session.state.paused, false); assert.equal(session.state.error, undefined); assert.deepEqual(texts(session), ['new context']);
  });
}

test('metadata failure stops the watcher/log timers, retains outdated records and recovers only on explicit Retry', async t => {
  const clock = new FakeClock(); let fail = false, reads = 0;
  const port: SnapshotPort = { loadPod: async () => pod, readLogs: async () => { reads++; return 'logs'; },
    watchPod: (_target, received, failed) => observe(async () => { if (fail) throw new Error('metadata forbidden'); return pod; }, received, failed, clock) };
  const session = new SnapshotSession(target, port, () => {}, new LogRequests(), clock); t.after(() => session.dispose());
  await session.open(); await flush(); const retained = session.state.snapshot;
  fail = true; clock.tick(3_000); await flush();
  assert.equal(session.state.snapshot, retained); assert(session.state.outdated); assert.match(session.state.error!, /metadata forbidden/);
  const count = reads; clock.tick(60_000); await flush(); assert.equal(reads, count); assert.equal(clock.jobs.size, 0);
  fail = false; await session.retry(); await flush(); assert.equal(session.state.error, undefined); assert(!session.state.outdated);
  clock.tick(3_000); await flush(); assert.equal(reads, count + 2);
});

test('restart count followed by the new instance ID does not clear the accepted current window twice', async t => {
  const h = setup(); t.after(() => h.session.dispose());
  void h.session.open(); await flush(); h.reads[0].response.resolve('old'); await flush();
  h.session.observePod({ ...pod, instances: { app: { restarts: 1 } } });
  h.reads[1].response.resolve('current'); await flush(); const current = h.session.state.snapshot;
  h.session.observePod({ ...pod, instances: { app: { restarts: 1, id: 'run-1' } } });
  assert.equal(h.session.state.snapshot, current); assert.equal(h.reads.length, 2);
});
