import test from 'node:test';
import assert from 'node:assert/strict';
import { FindClient, FindMatching } from '../src/renderer/find-client.ts';
import type { FindRequest, FindReply } from '../src/core/find-protocol.ts';
const input = (id = 1) => ({ key: { viewerEpoch: 1, targetEpoch: 1, instanceEpoch: 1, windowRevision: 1, messageRevision: 1, queryRevision: id },
  query: { text: 'a', matchCase: false, wholeWords: false }, records: [{ ref: { context: 'one', occurrence: 0 }, application: 'a' }] });
const tick = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
const setup = () => {
  let now = 0;
  const timers = new Set<{ at: number; run: () => void }>();
  const clock = { now: () => now, delay: (ms: number, run: () => void) => {
    const timer = { at: now + ms, run }; timers.add(timer); return () => { timers.delete(timer); };
  } };
  const calls: { channel: string; args: unknown[]; resolve: (reply: unknown) => void; reject: (error: Error) => void }[] = [];
  const client = new FindClient({ invoke: (channel, ...args) => new Promise((resolve, reject) => calls.push({ channel, args, resolve, reject })) }, 'viewer');
  const matching = new FindMatching(client, () => {}, clock);
  const advance = (ms: number) => {
    now += ms;
    for (const timer of timers) if (timer.at <= now) { timers.delete(timer); timer.run(); }
  };
  const open = async () => { calls.find(call => call.channel === 'find-open')!.resolve('token'); await tick(); };
  const reply = (index: number, overrides: Partial<FindReply> = {}) => {
    const call = calls.filter(call => call.channel === 'find-request')[index], request = call.args[1] as FindRequest;
    call.resolve({ key: request.key, requestId: request.requestId, workerGeneration: 1, kind: 'matches',
      records: [{ ref: request.records[0].ref, application: true, message: false }], ...overrides });
  };
  return { client, matching, calls, advance, open, reply, timers };
};

async function dispose(matching: FindMatching, calls: ReturnType<typeof setup>['calls']) {
  const closing = matching.dispose(); await tick();
  calls.filter(call => call.channel === 'find-control').forEach(call => call.resolve(undefined));
  await closing;
}

test('maintenance retains unchanged matches through delayed feedback without completing the new window', async () => {
  const { matching, calls, open, reply, advance } = setup();
  const first = input(); matching.update(first, 'edit'); await open(); reply(0); await tick();
  const known = matching.state.records;
  const appended = { ...first, key: { ...first.key, windowRevision: 2 },
    records: [...first.records, { ref: { context: 'one', occurrence: 1 }, application: 'another a' }] };
  assert.deepEqual(matching.knownMatches(appended), known, 'The render before maintenance lost confirmed source membership');
  matching.update(appended, 'maintenance'); await tick();
  assert.equal(matching.state.phase, 'pending'); assert.equal(matching.state.retained, true);
  assert.deepEqual(matching.state.records, known);
  advance(100); assert.equal(matching.state.searching, true);
  assert.deepEqual(matching.state.records, known, 'Searching feedback erased retained results');
  reply(1, { records: appended.records.map(record => ({ ref: record.ref, application: true, message: false })) }); await tick();
  assert.equal(matching.state.phase, 'ready'); assert.equal(matching.state.records.length, 2);
  matching.update(input(2), 'edit'); await tick();
  assert.deepEqual(matching.state.records, []); assert.equal(matching.state.retained, false);
  await dispose(matching, calls);
});

test('retained matches cannot survive changed source text, eviction, query flags or context', async () => {
  const changes = [
    (value: ReturnType<typeof input>) => ({ ...value, records: [{ ...value.records[0], application: 'changed' }] }),
    (value: ReturnType<typeof input>) => ({ ...value, records: [{ ...value.records[0], message: 'new decoded source' }] }),
    (value: ReturnType<typeof input>) => ({ ...value, records: [] }),
    ...(['viewerEpoch', 'targetEpoch', 'instanceEpoch', 'queryRevision'] as const).map(dimension =>
      (value: ReturnType<typeof input>) => ({ ...value, key: { ...value.key, [dimension]: 2 } })),
    (value: ReturnType<typeof input>) => ({ ...value, query: { ...value.query, matchCase: true } }),
    (value: ReturnType<typeof input>) => ({ ...value, query: { ...value.query, wholeWords: true } }),
    (value: ReturnType<typeof input>) => ({ ...value, query: { ...value.query, text: 'different' } }),
  ];
  for (const change of changes) {
    const { matching, calls, open, reply } = setup();
    const first = input(); matching.update(first, 'edit'); await open(); reply(0); await tick();
    const next = change({ ...first, key: { ...first.key, windowRevision: 2, messageRevision: 2 } });
    assert.equal(matching.knownMatches(next)?.length ?? 0, 0);
    matching.update(next, 'maintenance'); await tick();
    assert.deepEqual(matching.state.records, []);
    await dispose(matching, calls);
  }
});

test('pending and the whole-attempt deadline start before SDK registration resolves', async () => {
  const { matching, calls, advance, open, reply, timers } = setup();
  matching.update(input(), 'edit'); assert.equal(matching.state.phase, 'pending');
  advance(99); assert.equal(matching.state.searching, false);
  advance(1); assert.equal(matching.state.searching, true);
  advance(899); assert.equal(matching.state.phase, 'pending');
  advance(1); assert.equal(matching.state.phase, 'timeout'); assert.equal(timers.size, 0);
  await open(); assert.equal(calls.filter(call => call.channel === 'find-request').length, 0, 'Expired work dispatched after registration');
  matching.update(input(2), 'maintenance'); await tick(); assert.equal(matching.state.phase, 'timeout');
  matching.update(input(2), 'retry'); await tick(); reply(0); await tick();
  assert.equal(matching.state.phase, 'ready'); assert.equal(matching.state.records.length, 1);
  await dispose(matching, calls);
});

test('superseded successes and failures cannot publish into a newer query/window/message/context', async () => {
  for (const dimension of ['viewerEpoch', 'targetEpoch', 'instanceEpoch', 'windowRevision', 'messageRevision', 'queryRevision'] as const) {
    for (const failed of [false, true]) {
      const { matching, calls, open, reply } = setup();
      const first = input(); matching.update(first, 'edit'); await open();
      const next = { ...input(), key: { ...first.key, [dimension]: 2 } };
      matching.update(next, 'edit'); await tick();
      reply(0, failed ? { kind: 'failed', reason: 'execution' } : {}); await tick();
      assert.equal(matching.state.phase, 'pending', dimension);
      reply(1); await tick(); assert.equal(matching.state.phase, 'ready');
      assert.deepEqual(matching.state.key, next.key);
      await dispose(matching, calls);
    }
  }
});

test('worker failure latches through maintenance; edit and explicit Retry use current records', async () => {
  const { matching, calls, open, reply } = setup();
  matching.update(input(), 'edit'); await open(); reply(0, { kind: 'failed', reason: 'execution' }); await tick();
  assert.equal(matching.state.phase, 'execution');
  const latest = { ...input(2), records: [{ ref: { context: 'one', occurrence: 7 }, application: 'a latest' }] };
  matching.update(latest, 'maintenance'); await tick();
  assert.equal(calls.filter(call => call.channel === 'find-request').length, 1);
  matching.update(latest, 'retry'); await tick();
  const request = calls.filter(call => call.channel === 'find-request')[1].args[1] as FindRequest;
  assert.equal(request.records[0].application, 'a latest'); reply(1); await tick(); assert.equal(matching.state.records[0].ref.occurrence, 7);
  matching.update({ ...latest, key: input(3).key, query: { ...latest.query, matchCase: true } }, 'edit'); await tick();
  calls.filter(call => call.channel === 'find-request')[2].reject(new Error('bridge failure')); await tick();
  assert.equal(matching.state.phase, 'execution');
  await dispose(matching, calls);
});

test('oversized exact input is preserved without dispatch; empty clears and cancels pending work', async () => {
  const { matching, calls, open, reply, timers } = setup();
  const large = { ...input(), query: { text: 'a'.repeat(16385), matchCase: false, wholeWords: false } };
  matching.update(large, 'edit'); assert.equal(matching.state.phase, 'too-long'); assert.equal(calls.length, 0);
  matching.update(input(2), 'edit'); await open();
  matching.update({ ...input(3), query: { ...input().query, text: '' } }, 'edit'); await tick();
  reply(0); await tick(); assert.equal(matching.state.phase, 'empty'); assert.equal(timers.size, 0);
  assert.deepEqual(matching.state.records, []);
  await dispose(matching, calls);
});

test('inactivity stops work, keeps valid data and only recomputes pending current inputs on return', async () => {
  const { matching, calls, open, reply, timers } = setup();
  matching.update(input(), 'edit'); await open(); matching.setActive(false);
  reply(0); await tick(); assert.equal(matching.state.phase, 'pending'); assert.equal(timers.size, 0);
  matching.update(input(2), 'maintenance'); await tick(); assert.equal(calls.filter(call => call.channel === 'find-request').length, 1);
  matching.setActive(true); await tick(); reply(1); await tick(); assert.equal(matching.state.phase, 'ready');
  matching.setActive(false); matching.setActive(true); await tick();
  assert.equal(calls.filter(call => call.channel === 'find-request').length, 2, 'Valid data unnecessarily searched on return');
  await dispose(matching, calls);
});

test('malformed current replies fail locally and zero-hit exact replies complete normally', async () => {
  const { matching, calls, open, reply } = setup();
  matching.update(input(), 'edit'); await open();
  reply(0, { records: [{ ref: { context: 'foreign', occurrence: 0 }, application: true, message: false }] }); await tick();
  assert.equal(matching.state.phase, 'execution');
  matching.update(input(2), 'retry'); await tick(); reply(1, { records: [] }); await tick();
  assert.equal(matching.state.phase, 'ready'); assert.deepEqual(matching.state.records, []);
  await dispose(matching, calls);
});

test('closure during registration closes the eventual owner without dispatch or late state updates', async () => {
  const { matching, calls, open, timers } = setup();
  matching.update(input(), 'edit'); const closing = matching.dispose(); await open();
  assert.equal(calls.filter(call => call.channel === 'find-request').length, 0);
  assert.equal(timers.size, 0);
  const control = calls.find(call => call.channel === 'find-control' && call.args[1] === 'close'); assert(control);
  control.resolve(undefined); await closing;
});

test('composition suspends obsolete matching and evaluates only the committed input once', async () => {
  const { matching, calls, open, reply } = setup();
  matching.update(input(), 'edit'); await open();
  matching.setComposing(true);
  matching.update(input(2), 'edit'); await tick();
  assert.equal(calls.filter(call => call.channel === 'find-request').length, 1);
  reply(0); await tick(); assert.equal(matching.state.phase, 'pending');
  matching.setComposing(false); matching.update(input(3), 'edit'); await tick();
  assert.equal(calls.filter(call => call.channel === 'find-request').length, 2);
  reply(1); await tick(); assert.equal(matching.state.phase, 'ready');
  await dispose(matching, calls);
});
