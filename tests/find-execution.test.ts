import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { FindExecution } from '../src/main/find-execution.ts';
import type { FindRequest } from '../src/core/find-protocol.ts';

class Clock {
  time = 0;
  next = 0;
  callbacks = new Map<number, { at: number; run: () => void }>();
  now = () => this.time;
  delay = (ms: number, run: () => void) => {
    const id = ++this.next; this.callbacks.set(id, { at: this.time + ms, run });
    return () => { this.callbacks.delete(id); };
  };
  advance(ms: number) {
    const end = this.time + ms;
    while (true) {
      const due = [...this.callbacks].filter(([, item]) => item.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      this.time = due[1].at; this.callbacks.delete(due[0]); due[1].run();
    }
    this.time = end;
  }
}
class Worker extends EventEmitter {
  posted: { request: FindRequest; workerGeneration: number }[] = [];
  stopping = false;
  postMessage(value: { request: FindRequest; workerGeneration: number }) { this.posted.push(value); }
  async terminate() { this.stopping = true; return 1; } // Resolution is deliberately earlier than exit.
  ready() { this.emit('message', { kind: 'ready', version: 'test' }); }
  exit() { this.emit('exit', 1); }
  complete() {
    const { request, workerGeneration } = this.posted.at(-1)!;
    this.emit('message', { requestId: request.requestId, key: request.key, workerGeneration,
      kind: 'matches', records: [{ ref: request.records[0].ref, application: true, message: false }] });
  }
}
const input = (id: number): FindRequest => ({ requestId: id,
  key: { viewerEpoch: 1, targetEpoch: 1, instanceEpoch: 1, windowRevision: 1, messageRevision: 1, queryRevision: id },
  query: { text: 'a', matchCase: false, wholeWords: false }, records: [{ ref: { context: 'current', occurrence: 0 }, application: 'a' }], work: 'match' });
const setup = () => {
  const clock = new Clock(), workers: Worker[] = [];
  const execution = new FindExecution(() => { const worker = new Worker(); workers.push(worker); return worker; }, 'test', clock);
  return { execution, clock, workers };
};

test('execution is lazy, reuses a successful worker and awaits actual exit at disposal', async () => {
  const { execution, workers } = setup();
  assert.equal(workers.length, 0);
  const first = execution.submit(input(1)); assert.equal(workers.length, 1);
  workers[0].ready(); workers[0].complete(); assert.equal((await first)?.kind, 'matches');
  const second = execution.submit(input(2));
  assert.equal(workers.length, 1); workers[0].complete(); assert.equal((await second)?.requestId, 2);
  let disposed = false;
  const closing = execution.dispose().then(() => { disposed = true; });
  await Promise.resolve(); assert.equal(disposed, false);
  workers[0].exit(); await closing; assert.equal(disposed, true);
});

test('supersession during startup keeps only the newest request and waits for late actual exit', { timeout: 2000 }, async () => {
  const { execution, workers } = setup();
  const first = execution.submit(input(1));
  const replacements = Array.from({ length: 99 }, (_, i) => execution.submit(input(i + 2)));
  assert.equal(await first, undefined);
  assert.equal(workers.length, 1);
  assert.equal(workers[0].stopping, true);
  workers[0].ready();
  assert.equal(workers[0].posted.length, 0);
  await Promise.resolve(); assert.equal(workers.length, 1, 'terminate resolving is not actual exit');
  workers[0].exit();
  assert.equal(workers.length, 2);
  workers[1].ready(); assert.equal(workers[1].posted[0].request.requestId, 100);
  workers[1].complete();
  assert((await replacements.slice(0, -1).reduce(async (ok, promise) => (await ok) && (await promise) === undefined, Promise.resolve(true))));
  assert.equal((await replacements.at(-1))?.requestId, 100);
  const closing = execution.dispose(); workers[1].exit(); await closing;
});

test('the whole attempt expires at 1000ms including startup and time waiting for old exit', { timeout: 2000 }, async () => {
  const { execution, clock, workers } = setup();
  const first = execution.submit(input(1));
  clock.advance(999); assert.equal(workers[0].stopping, false);
  clock.advance(1); assert.equal((await first)?.kind, 'failed');
  assert.equal((await first as { reason: string }).reason, 'timeout');
  assert.equal(workers[0].stopping, true);
  workers[0].ready(); assert.equal(workers[0].posted.length, 0);
  const second = execution.submit(input(2));
  clock.advance(1000);
  assert.equal((await second as { reason: string }).reason, 'timeout');
  workers[0].exit(); assert.equal(workers.length, 1, 'Expired queued request started a new worker');
  const retry = execution.submit(input(3)); workers[1].ready(); workers[1].complete();
  assert.equal((await retry)?.requestId, 3);
  const closing = execution.dispose(); workers[1].exit(); await closing;
  assert.equal(clock.callbacks.size, 0);
});

test('oversized and empty inputs cancel obsolete work without allocating another worker', { timeout: 2000 }, async () => {
  const { execution, workers } = setup();
  const empty = input(1); empty.query.text = '';
  const cleared = await execution.submit(empty);
  assert(cleared?.kind === 'matches'); assert.deepEqual(cleared.records, []);
  assert.equal(workers.length, 0);
  const first = execution.submit(input(2)); workers[0].ready();
  const oversized = input(3); oversized.query.text = 'a'.repeat(16385);
  assert.equal((await execution.submit(oversized) as { reason: string }).reason, 'too-long');
  assert.equal(await first, undefined);
  assert.equal(workers[0].stopping, true);
  const closing = execution.dispose(); workers[0].exit(); await closing;
});

test('malformed current worker replies fail locally and never apply their data', { timeout: 2000 }, async () => {
  for (const change of [{ kind: 'garbage' }, { records: 'bad-data' }, { records: [{ ref: { context: 'foreign', occurrence: 0 }, application: true, message: false }] }]) {
    const { execution, workers } = setup();
    const pending = execution.submit(input(1)); const worker = workers[0]; worker.ready();
    worker.emit('message', { requestId: 1, key: input(1).key, workerGeneration: 1, kind: 'matches',
      records: [{ ref: input(1).records[0].ref, application: true, message: false }], ...change });
    const reply = await pending;
    assert(reply?.kind === 'failed'); assert.equal(reply.reason, 'execution');
    assert.equal(worker.stopping, true);
    const retry = execution.submit(input(2));
    worker.emit('error', new Error('late old-worker error'));
    worker.exit(); workers[1].ready(); workers[1].complete();
    assert.equal((await retry)?.requestId, 2);
    const closing = execution.dispose(); workers[1].exit(); await closing;
  }
});

test('range-interest churn keeps exact matching running and retains only the newest interest', { timeout: 2000 }, async () => {
  const { execution, workers } = setup();
  const matchInput = input(1), match = execution.submit(matchInput); workers[0].ready();
  const ranges = Array.from({ length: 99 }, (_, index) => execution.submit({ ...matchInput, requestId: index + 2,
    work: 'ranges', rangeInterest: { id: index + 2, scopes: [{ ref: matchInput.records[0].ref, source: 'application', start: 0, end: 1 }] } }));
  assert.equal(workers[0].stopping, false, 'Decoration churn canceled exact matching');
  workers[0].complete(); assert.equal((await match)?.kind, 'matches');
  assert.equal(workers[0].posted.length, 2);
  assert.equal(workers[0].posted[1].request.rangeInterest?.id, 100);
  assert((await Promise.all(ranges.slice(0, -1))).every(value => value === undefined));
  const request = workers[0].posted[1].request;
  workers[0].emit('message', { requestId: 100, key: request.key, workerGeneration: 1, kind: 'ranges', interestId: 100,
    ranges: request.rangeInterest!.scopes, coverage: request.rangeInterest!.scopes.map(scope => ({ scope, complete: true })) });
  assert.equal((await ranges.at(-1))?.kind, 'ranges');
  const closing = execution.dispose(); workers[0].exit(); await closing;
});

test('inactivity releases idle/startup execution; reactivation waits for exit and old request IDs stay obsolete', { timeout: 2000 }, async () => {
  for (const idle of [false, true]) {
    const { execution, workers, clock } = setup();
    const first = execution.submit(input(1));
    if (idle) { workers[0].ready(); workers[0].complete(); await first; }
    let inactive = false;
    const stopping = execution.setActive(false).then(() => { inactive = true; });
    assert.equal(workers[0].stopping, true); assert.equal(clock.callbacks.size, 0);
    assert.equal(await execution.submit(input(2)), undefined);
    await execution.setActive(true);
    const next = execution.submit(input(3));
    assert.equal(workers.length, 1);
    await Promise.resolve(); assert.equal(inactive, false);
    workers[0].exit(); await stopping; assert.equal(workers.length, 2);
    workers[1].ready(); workers[1].complete(); await next;
    assert.equal(await execution.submit(input(1)), undefined);
    assert.equal(workers[1].posted.length, 1);
    const closing = execution.dispose(); workers[1].exit(); await closing;
    assert.equal(workers[1].eventNames().length, 0);
    if (!idle) assert.equal(await first, undefined);
  }
});

test('stale successes and failures cannot fail or finish a newer operation', { timeout: 2000 }, async () => {
  const { execution, workers } = setup();
  const pending = execution.submit(input(1)); workers[0].ready();
  let settled = false; void pending.then(() => { settled = true; });
  for (const change of [{ requestId: 0 }, { workerGeneration: 0 }, ...Object.keys(input(1).key).map(dimension => ({ key: { ...input(1).key, [dimension]: 0 } }))]) {
    workers[0].emit('message', { requestId: 1, key: input(1).key, workerGeneration: 1, kind: 'failed', reason: 'execution', ...change });
    workers[0].emit('message', { requestId: 1, key: input(1).key, workerGeneration: 1, kind: 'matches', records: [], ...change });
  }
  await Promise.resolve(); assert.equal(settled, false); assert.equal(workers[0].stopping, false);
  workers[0].complete(); assert.equal((await pending)?.kind, 'matches');
  const closing = execution.dispose(); workers[0].exit(); await closing;
});

test('a reply delivered after the allowance expires cannot win a delayed timer callback', { timeout: 2000 }, async () => {
  const { execution, workers, clock } = setup();
  const pending = execution.submit(input(1)); workers[0].ready();
  clock.time = 1001; // Model a blocked event loop: wall time advances before timers run.
  workers[0].complete();
  const reply = await pending; assert(reply?.kind === 'failed'); assert.equal(reply.reason, 'timeout');
  assert.equal(workers[0].stopping, true);
  const closing = execution.dispose(); workers[0].exit(); await closing;
});
