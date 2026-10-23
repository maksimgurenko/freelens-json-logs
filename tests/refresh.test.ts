import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LogRequests, type Clock } from '../src/core/requests.ts';
import { SnapshotSession } from '../src/core/session.ts';
import { formatDefault } from '../src/core/records.ts';
import type { LogTarget } from '../src/core/target.ts';

class FakeClock implements Clock {
  time = 0;
  jobs = new Set<{ at: number; callback: () => void }>();
  now() { return this.time; }
  schedule(delay: number, callback: () => void) {
    const job = { at: this.time + delay, callback };
    this.jobs.add(job);
    return () => { this.jobs.delete(job); };
  }
  tick(delay: number) {
    const end = this.time + delay;
    for (;;) {
      const job = [...this.jobs].filter(job => job.at <= end).sort((a, b) => a.at - b.at)[0];
      if (!job) break;
      this.time = job.at;
      this.jobs.delete(job);
      job.callback();
    }
    this.time = end;
  }
}
function deferred() {
  let resolve!: (value: string) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<string>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
const target: LogTarget = { clusterId: 'cluster', clusterName: 'Cluster', namespace: 'ns', podName: 'pod', podUid: 'uid' };
function setup() {
  const clock = new FakeClock();
  const pool = new LogRequests();
  const calls: { container: string; response: ReturnType<typeof deferred>; at: number; target: LogTarget }[] = [];
  const sessions: SnapshotSession[] = [];
  const create = (identity = target) => {
    const session = new SnapshotSession(identity, {
      loadPod: async () => ({ uid: identity.podUid, regular: ['first', 'second'], init: [], ephemeral: [] }),
      readLogs(target, container) {
        const response = deferred();
        calls.push({ target, container, response, at: clock.time });
        return response.promise;
      },
    }, () => {}, pool, clock);
    sessions.push(session);
    return session;
  };
  return { clock, calls, create, session: create(), close: () => sessions.forEach(session => session.dispose()) };
}

test('immediate fetch, then 3 seconds after settlement; replace window preserving repeated lines', async t => {
  const h = setup(); t.after(h.close);
  const opened = h.session.open(); await flush();
  assert.equal(h.calls.length, 1);
  h.clock.tick(8_000); // Response time is separate from refresh cadence.
  h.calls[0].response.resolve('old\n'); await opened;
  h.clock.tick(2_999); assert.equal(h.calls.length, 1);
  h.clock.tick(1); assert.equal(h.calls.length, 2); assert.equal(h.calls[1].at, 11_000);
  h.calls[1].response.resolve('same\nsame\n'); await flush();
  assert.deepEqual(h.session.state.snapshot?.records.map(r => r.applicationText), ['same', 'same']);
});

test('repeated Refresh coalesces, slow/hung reads never time out or overlap', async t => {
  const h = setup(); t.after(h.close);
  void h.session.open(); await flush();
  const a = h.session.refresh();
  assert.equal(h.session.refresh(), a);
  for (let i = 0; i < 20; i++) void h.session.refresh();
  h.clock.tick(14_999); assert.equal(h.session.state.slow, false);
  h.clock.tick(1); assert.equal(h.session.state.slow, true);
  h.clock.tick(600_000); assert.equal(h.calls.length, 1); assert.equal(h.session.state.refreshing, true);
  h.calls[0].response.resolve('fresh'); await a;
  assert.equal(h.session.state.slow, false);
  assert.equal(h.clock.jobs.size, 1);
});

test('Pause freezes originals and local formatting remains available; paused Refresh fetches once', async t => {
  const h = setup(); t.after(h.close);
  void h.session.open(); await flush();
  h.calls[0].response.resolve('{"msg":"frozen"}\n'); await flush();
  const frozen = h.session.state.snapshot;
  h.clock.tick(3_000); assert.equal(h.calls.length, 2);
  h.session.pause(); assert.equal(h.clock.jobs.size, 0);
  assert.equal(h.session.state.snapshot, frozen);
  h.calls[1].response.resolve('discard'); await flush();
  h.clock.tick(90_000); assert.equal(h.calls.length, 2);
  assert.equal(formatDefault(h.session.state.snapshot!.records[0]).message, 'frozen');
  assert.equal(h.calls.length, 2); // Local presentation does not ask the port for more logs.
  const refresh = h.session.refresh(); assert.equal(h.calls.length, 3);
  h.calls[2].response.resolve('manual'); await refresh;
  assert.equal(h.session.state.paused, true);
  assert.equal(h.session.state.snapshot?.records[0].applicationText, 'manual');
  h.clock.tick(90_000); assert.equal(h.calls.length, 3);
});

for (const failure of [false, true]) {
  test(`Resume waits for invalidated ${failure ? 'failure' : 'success'} and requests fresh data; no queued Refresh pile`, async t => {
    const h = setup(); t.after(h.close);
    void h.session.open(); await flush();
    h.clock.tick(14_000);
    h.session.pause();
    const resumed = h.session.resume();
    for (let i = 0; i < 20; i++) void h.session.refresh();
    assert.equal(h.session.state.waiting, true); assert.equal(h.calls.length, 1);
    h.clock.tick(1_000); assert.equal(h.session.state.slow, true); // Original request's age.
    if (failure) h.calls[0].response.reject({ message: 'late denial' }); else h.calls[0].response.resolve('late success');
    await flush();
    assert.equal(h.calls.length, 2); assert.equal(h.session.state.error, undefined);
    assert.equal(Boolean(h.session.state.snapshot), false); assert.equal(h.session.state.slow, false);
    h.calls[1].response.resolve('fresh'); await resumed;
    assert.equal(h.session.state.snapshot?.records[0].applicationText, 'fresh');
    h.clock.tick(3_000); assert.equal(h.calls.length, 3);
  });
}

test('paused Refresh waits for invalidated read and remains paused; pausing again invalidates queued intent', async t => {
  const h = setup(); t.after(h.close);
  void h.session.open(); await flush();
  h.session.pause(); void h.session.refresh();
  h.session.pause(); // Discard queued intent too.
  h.calls[0].response.resolve('discard'); await flush(); assert.equal(h.calls.length, 1);
  void h.session.refresh(); assert.equal(h.calls.length, 2);
  h.session.pause(); const refresh = h.session.refresh();
  h.calls[1].response.resolve('discard again'); await flush(); assert.equal(h.calls.length, 3);
  h.calls[2].response.resolve('once'); await refresh;
  assert.equal(h.session.state.paused, true); assert.equal(h.clock.jobs.size, 0);
});

for (const failure of [false, true]) {
  test(`target changes proceed independently and discard old ${failure ? 'errors' : 'data'} even after switching back`, async t => {
    const h = setup(); t.after(h.close);
    void h.session.open(); await flush();
    void h.session.selectContainer('second'); assert.equal(h.calls.length, 2);
    h.calls[1].response.resolve('second'); await flush();
    const back = h.session.selectContainer('first');
    assert.equal(Boolean(h.session.state.snapshot), false); assert.equal(h.calls.length, 2);
    if (failure) h.calls[0].response.reject('old failure'); else h.calls[0].response.resolve('old first');
    await flush(); assert.equal(h.calls.length, 3); assert.equal(h.session.state.error, undefined);
    h.calls[2].response.resolve('new first'); await back;
    assert.equal(h.session.state.snapshot?.records[0].applicationText, 'new first');
  });
}

test('different Pod/cluster/UID is independent; departed same target waits across sessions and reopens fresh', async t => {
  const h = setup(); t.after(h.close);
  void h.session.open(); await flush(); h.session.dispose();
  const reopened = h.create(); void reopened.open(); await flush();
  assert.equal(h.calls.length, 1); assert.equal(reopened.state.waiting, true);
  const other = h.create({ ...target, clusterId: 'another', podUid: 'replacement' });
  void other.open(); await flush(); assert.equal(h.calls.length, 2);
  h.calls[0].response.reject('late after departure'); await flush(); assert.equal(h.calls.length, 3);
  assert.equal(reopened.state.error, undefined); assert.equal(h.session.state.phase, 'closed');
  h.calls[2].response.resolve('reopened'); await flush();
  assert.equal(reopened.state.snapshot?.records[0].applicationText, 'reopened');
});

for (const end of ['inactive', 'dispose'] as const) {
  for (const failure of [false, true]) {
    test(`${end} clears timers and rejects late ${failure ? 'failure' : 'success'}`, async t => {
      const h = setup(); t.after(h.close);
      void h.session.open(); await flush();
      if (end === 'inactive') h.session.setActive(false); else h.session.dispose();
      assert.equal(h.clock.jobs.size, 0);
      if (failure) h.calls[0].response.reject('late'); else h.calls[0].response.resolve('late');
      await flush(); h.clock.tick(60_000);
      assert.equal(Boolean(h.session.state.snapshot), false); assert.equal(h.session.state.error, undefined);
      assert.equal(h.calls.length, 1); assert.equal(h.clock.jobs.size, 0);
    });
  }
}

test('inactive automatic view refreshes on return; inactive paused view keeps Pause', async t => {
  const h = setup(); t.after(h.close);
  void h.session.open(); await flush(); h.calls[0].response.resolve('first'); await flush();
  h.session.setActive(false); h.clock.tick(60_000); assert.equal(h.calls.length, 1);
  h.session.setActive(true); assert.equal(h.calls.length, 2);
  h.calls[1].response.resolve('returned'); await flush(); h.session.pause();
  h.session.setActive(false); h.session.setActive(true); assert.equal(h.calls.length, 2);
});

test('genuine empty success replaces window and continues automatic mode', async t => {
  const h = setup(); t.after(h.close);
  void h.session.open(); await flush(); h.calls[0].response.resolve('before'); await flush();
  h.clock.tick(3_000); h.calls[1].response.resolve(''); await flush();
  assert.equal(h.session.state.snapshot?.returnedLines, 0);
  assert.equal(h.session.state.snapshot?.records.length, 0);
  assert.equal(h.session.state.error, undefined);
  h.clock.tick(3_000); assert.equal(h.calls.length, 3);
});

for (const paused of [false, true]) {
  test(`failure retains outdated window; failed Retry stops; successful Retry ${paused ? 'keeps Pause' : 'restores automatic mode'}`, async t => {
    const h = setup(); t.after(h.close);
    void h.session.open(); await flush(); h.calls[0].response.resolve('last good'); await flush();
    const retained = h.session.state.snapshot;
    if (paused) h.session.pause();
    void h.session.refresh(); h.calls[1].response.reject({ body: { message: 'pods/log is forbidden: test-reader' } }); await flush();
    assert.equal(h.session.state.error, 'pods/log is forbidden: test-reader');
    assert.equal(h.session.state.snapshot, retained); assert.equal(h.session.state.outdated, true);
    h.clock.tick(60_000); assert.equal(h.calls.length, 2);
    const failed = h.session.retry(); h.calls[2].response.reject(new Error('connection refused')); await failed;
    assert.equal(h.session.state.error, 'connection refused');
    h.clock.tick(60_000); assert.equal(h.calls.length, 3);
    const recovered = h.session.retry(); h.calls[3].response.resolve('recovered'); await recovered;
    assert.equal(h.session.state.error, undefined); assert.equal(h.session.state.outdated, false);
    assert.equal(h.session.state.paused, paused);
    h.clock.tick(3_000); assert.equal(h.calls.length, paused ? 4 : 5);
  });
}

test('initial error has no empty success; Retry recovers metadata errors as well as log errors', async t => {
  const h = setup(); t.after(h.close);
  void h.session.open(); await flush(); h.calls[0].response.reject('initial denial'); await flush();
  assert.equal(Boolean(h.session.state.snapshot), false); assert.equal(h.session.state.phase, 'error');
  const retry = h.session.retry(); h.calls[1].response.resolve(''); await retry;
  assert.equal(h.session.state.phase, 'ready'); assert.equal(h.session.state.snapshot?.returnedLines, 0);
  let denied = true;
  const metadata = new SnapshotSession(target, {
    loadPod: async () => { if (denied) throw new Error('Pod metadata forbidden'); return { uid: 'uid', regular: ['first'], init: [], ephemeral: [] }; },
    readLogs: async () => 'metadata recovered',
  }, () => {}, new LogRequests(), h.clock);
  t.after(() => metadata.dispose());
  await metadata.open(); assert.equal(metadata.state.phase, 'error');
  denied = false; await metadata.retry(); assert.equal(metadata.state.phase, 'ready');
});
