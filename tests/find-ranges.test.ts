import test from 'node:test';
import assert from 'node:assert/strict';
import { FindClient } from '../src/renderer/find-client.ts';
import { FindRanges } from '../src/renderer/find-ranges.ts';
import type { FindRequest } from '../src/core/find-protocol.ts';

test('complete visible coverage survives appends and layout changes but changed text is recomputed', async () => {
  const calls: FindRequest[] = [];
  const client = new FindClient({ async invoke(channel, ...args) {
    if (channel === 'find-open') return 'owner';
    if (channel !== 'find-request') return;
    const request = args[1] as FindRequest; calls.push(request);
    return { requestId: request.requestId, key: request.key, workerGeneration: 1, kind: 'ranges', interestId: request.rangeInterest!.id,
      ranges: request.rangeInterest!.scopes, coverage: request.rangeInterest!.scopes.map(scope => ({ scope, complete: true })) };
  } }, 'viewer');
  const ranges = new FindRanges(client, () => {}), ref = { context: 'one', occurrence: 0 };
  const inputs = { key: { viewerEpoch: 1, targetEpoch: 1, instanceEpoch: 1, windowRevision: 1, messageRevision: 1, queryRevision: 1 },
    query: { text: 'a', matchCase: false, wholeWords: false }, records: [{ ref, application: 'a a a' }] };
  const scope = { ref, source: 'application' as const, start: 0, end: 5 };
  const tick = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
  try {
    ranges.update(inputs, [scope], 1); await tick();
    ranges.pause();
    const appended = { ...inputs, key: { ...inputs.key, windowRevision: 2, messageRevision: 2 },
      records: [...inputs.records, { ref: { ...ref, occurrence: 1 }, application: 'new a' }] };
    ranges.update(appended, [scope], 2); await tick();
    assert.equal(calls.length, 1, 'Unchanged visible source was sent through the worker again');
    ranges.update(appended, [scope], 3); await tick(); assert.equal(calls.length, 1);
    const changed = { ...appended, key: { ...appended.key, messageRevision: 3 },
      records: [{ ref, application: 'a a b' }, appended.records[1]] };
    ranges.update(changed, [scope], 4); await tick(); assert.equal(calls.length, 2);
    ranges.update({ ...changed, key: { ...changed.key, queryRevision: 2 }, query: { ...changed.query, wholeWords: true } }, [scope], 5);
    await tick(); assert.equal(calls.length, 3);
  } finally { ranges.dispose(); await client.dispose(); }
});

test('a clipping resize inside pending coverage completes without restarting decoration', async () => {
  const calls: { request: FindRequest; resolve: (value: unknown) => void }[] = [];
  const client = new FindClient({ async invoke(channel, ...args) {
    if (channel === 'find-open') return 'owner';
    if (channel === 'find-request') return new Promise(resolve => calls.push({ request: args[1] as FindRequest, resolve }));
  } }, 'viewer');
  const ranges = new FindRanges(client, () => {}), ref = { context: 'one', occurrence: 0 };
  const inputs = { key: { viewerEpoch: 1, targetEpoch: 1, instanceEpoch: 1, windowRevision: 1, messageRevision: 1, queryRevision: 1 },
    query: { text: 'a', matchCase: false, wholeWords: false }, records: [{ ref, application: 'a a a' }] };
  const scope = { ref, source: 'application' as const, start: 0, end: 5 };
  const tick = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
  try {
    ranges.update(inputs, [scope], 1); await tick();
    ranges.update(inputs, [{ ...scope, start: 2, end: 3 }], 1); await tick();
    const { request, resolve } = calls[0];
    resolve({ requestId: request.requestId, key: request.key, workerGeneration: 1, kind: 'ranges', interestId: request.rangeInterest!.id,
      ranges: [{ ...scope, start: 2, end: 3 }], coverage: [{ scope, complete: true }] });
    await tick();
    assert.equal(ranges.state.phase, 'ready', 'Shrinking the clip discarded a reply covering the visible text');
    assert.equal(calls.length, 1);
    ranges.update(inputs, [scope], 1); await tick();
    assert.equal(ranges.state.phase, 'ready'); assert.equal(calls.length, 1);
  } finally { ranges.dispose(); await client.dispose(); }
});

test('incomplete coverage still requests a narrower late-source interest', async () => {
  const calls: FindRequest[] = [];
  const client = new FindClient({ async invoke(channel, ...args) {
    if (channel === 'find-open') return 'owner';
    if (channel !== 'find-request') return;
    const request = args[1] as FindRequest; calls.push(request);
    return { requestId: request.requestId, key: request.key, workerGeneration: 1, kind: 'ranges', interestId: request.rangeInterest!.id,
      ranges: [{ ...request.rangeInterest!.scopes[0], end: request.rangeInterest!.scopes[0].start + 1 }],
      coverage: request.rangeInterest!.scopes.map(scope => ({ scope, complete: calls.length > 1 })) };
  } }, 'viewer');
  const ranges = new FindRanges(client, () => {}), ref = { context: 'one', occurrence: 0 };
  const inputs = { key: { viewerEpoch: 1, targetEpoch: 1, instanceEpoch: 1, windowRevision: 1, messageRevision: 1, queryRevision: 1 },
    query: { text: 'a', matchCase: false, wholeWords: false }, records: [{ ref, application: 'a a a' }] };
  const scope = { ref, source: 'application' as const, start: 0, end: 5 };
  const tick = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
  try {
    ranges.update(inputs, [scope], 1); await tick(); assert.equal(ranges.state.complete, false);
    ranges.update(inputs, [{ ...scope, start: 4 }], 1); await tick();
    assert.equal(calls.length, 2); assert.equal(ranges.state.phase, 'ready'); assert.equal(ranges.state.complete, true);
    assert.equal(ranges.state.ranges[0].start, 4);
  } finally { ranges.dispose(); await client.dispose(); }
});

test('a newer covered interest is evaluated after a pending broad reply proves incomplete', async () => {
  const calls: { request: FindRequest; resolve: (value: unknown) => void }[] = [];
  const client = new FindClient({ async invoke(channel, ...args) {
    if (channel === 'find-open') return 'owner';
    if (channel === 'find-request') return new Promise(resolve => calls.push({ request: args[1] as FindRequest, resolve }));
  } }, 'viewer');
  const ranges = new FindRanges(client, () => {}), ref = { context: 'one', occurrence: 0 };
  const inputs = { key: { viewerEpoch: 1, targetEpoch: 1, instanceEpoch: 1, windowRevision: 1, messageRevision: 1, queryRevision: 1 },
    query: { text: 'a', matchCase: false, wholeWords: false }, records: [{ ref, application: 'a a a' }] };
  const scope = { ref, source: 'application' as const, start: 0, end: 5 };
  const tick = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
  const reply = (index: number, start: number, complete: boolean) => {
    const { request, resolve } = calls[index];
    resolve({ requestId: request.requestId, key: request.key, workerGeneration: 1, kind: 'ranges', interestId: request.rangeInterest!.id,
      ranges: [{ ...scope, start, end: start + 1 }], coverage: request.rangeInterest!.scopes.map(scope => ({ scope, complete })) });
  };
  try {
    ranges.update(inputs, [scope], 1); await tick();
    ranges.update(inputs, [{ ...scope, start: 2, end: 3 }], 1);
    ranges.update(inputs, [{ ...scope, start: 4 }], 1); await tick();
    assert.equal(calls.length, 1, 'Covered pending work should retain its deadline');
    reply(0, 0, false); await tick();
    assert.equal(calls.length, 2, 'Incomplete pending reply lost the latest visible interest');
    assert.deepEqual(calls[1].request.rangeInterest!.scopes, [{ ...scope, start: 4 }]);
    reply(1, 4, true); await tick();
    assert.equal(ranges.state.phase, 'ready'); assert.equal(ranges.state.ranges[0].start, 4);
  } finally { ranges.dispose(); await client.dispose(); }
});

test('decoration failure latches independently of exact matching and explicit retry uses current interest', async () => {
  const requests: FindRequest[] = [];
  let fail = true;
  const client = new FindClient({ async invoke(channel, ...args) {
    if (channel === 'find-open') return 'owner';
    if (channel !== 'find-request') return;
    const request = args[1] as FindRequest; requests.push(request);
    if (fail) throw new Error('Controlled range failure');
    return { requestId: request.requestId, key: request.key, workerGeneration: 1, kind: 'ranges', interestId: request.rangeInterest!.id,
      ranges: [], coverage: request.rangeInterest!.scopes.map(scope => ({ scope, complete: true })) };
  } }, 'viewer');
  const ranges = new FindRanges(client, () => {});
  const record = { ref: { context: 'one', occurrence: 0 }, application: 'a' };
  const inputs = { key: { viewerEpoch: 1, targetEpoch: 1, instanceEpoch: 1, windowRevision: 1, messageRevision: 1, queryRevision: 1 },
    query: { text: 'a', matchCase: false, wholeWords: false }, records: [record] };
  const scopes = [{ ref: record.ref, source: 'application' as const, start: 0, end: 1 }];
  const tick = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
  ranges.update(inputs, scopes, 1); await tick();
  assert.equal(ranges.state.phase, 'failed');
  const current = { ...inputs, key: { ...inputs.key, windowRevision: 2 } };
  ranges.update(current, scopes, 2); await tick(); assert.equal(requests.length, 1);
  fail = false; ranges.retry(); await tick();
  assert.equal(ranges.state.phase, 'ready'); assert.equal(requests.length, 2);
  assert.equal(requests[1].key.windowRevision, 2);
  assert(requests[1].requestId > requests[0].requestId);
  ranges.dispose(); await client.dispose();
});

test('new visible interest rejects old success/failure and its deadline covers registration and dispatch', async () => {
  let now = 0;
  const timers = new Set<() => void>();
  const calls: { request: FindRequest; resolve: (value: unknown) => void }[] = [];
  const client = new FindClient({ async invoke(channel, ...args) {
    if (channel === 'find-open') return 'owner';
    if (channel !== 'find-request') return;
    return new Promise(resolve => calls.push({ request: args[1] as FindRequest, resolve }));
  } }, 'viewer');
  const ranges = new FindRanges(client, () => {}, { now: () => now, delay: (_ms, run) => { timers.add(run); return () => { timers.delete(run); }; } });
  const ref = { context: 'one', occurrence: 0 };
  const inputs = { key: { viewerEpoch: 1, targetEpoch: 1, instanceEpoch: 1, windowRevision: 1, messageRevision: 1, queryRevision: 1 },
    query: { text: 'a', matchCase: false, wholeWords: false }, records: [{ ref, application: 'a a' }] };
  const scope = { ref, source: 'application' as const, start: 0, end: 1 };
  const tick = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
  ranges.update(inputs, [scope], 1); await tick();
  ranges.update(inputs, [{ ...scope, start: 2, end: 3 }], 2); await tick();
  const reply = (index: number, failed = false) => {
    const { request, resolve } = calls[index];
    resolve({ requestId: request.requestId, key: request.key, workerGeneration: 1,
      ...(failed ? { kind: 'failed', reason: 'execution' } : { kind: 'ranges', interestId: request.rangeInterest!.id,
        ranges: request.rangeInterest!.scopes, coverage: request.rangeInterest!.scopes.map(scope => ({ scope, complete: true })) }) });
  };
  reply(0, true); await tick(); assert.equal(ranges.state.phase, 'pending');
  reply(1); await tick(); assert.equal(ranges.state.phase, 'ready'); assert.equal(ranges.state.ranges[0].start, 2);
  ranges.update(inputs, [scope], 3); await tick(); now = 1000;
  for (const run of timers) run();
  assert.equal(ranges.state.phase, 'failed'); assert.equal(timers.size, 0);
  reply(2); await tick(); assert.equal(ranges.state.phase, 'failed');
  ranges.clear(); ranges.update(inputs, [scope], 4); await tick(); assert.equal(calls.length, 3, 'Inactivity retried a failed query');
  ranges.dispose(); await client.dispose(); assert.equal(timers.size, 0);
});
