import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import { once } from 'node:events';
import { performance } from 'node:perf_hooks';

/** Called with the actual unpacked tarball asset, never a recompiled stand-in. */
export async function checkFindWorker(source, version) {
  const worker = new Worker(source, { eval: true });
  const exited = once(worker, 'exit');
  const deadline = setTimeout(() => { void worker.terminate(); }, 10_000);
  const key = { viewerEpoch: 1, targetEpoch: 2, instanceEpoch: 3, windowRevision: 4, messageRevision: 5, queryRevision: 6 };
  const ref = occurrence => ({ context: 'packed-worker-context', occurrence });
  let requestId = 0;
  const run = async (query, records, interest) => {
    const reply = once(worker, 'message');
    const request = { requestId: ++requestId, key, query, records, work: interest ? 'ranges' : 'match',
      ...(interest ? { rangeInterest: interest } : {}) };
    worker.postMessage({ workerGeneration: 7, request });
    const [value] = await reply;
    assert.equal(value.requestId, request.requestId);
    assert.deepEqual(value.key, key);
    assert.equal(value.workerGeneration, 7);
    return value;
  };
  let exitMs;
  try {
    assert.deepEqual((await once(worker, 'message'))[0], { kind: 'ready', version });
    const records = [
      { ref: ref(0), application: '{"message":"\\u03a3","hidden":"needle"}', message: 'Σ' },
      { ref: ref(1), application: 'a a', message: 'a a' },
      { ref: ref(2), application: '😀\u0345A\u0345' },
    ];
    const query = { text: 'σ', matchCase: false, wholeWords: false };
    assert.deepEqual((await run(query, records)).records, [{ ref: ref(0), application: false, message: true }]);
    assert.deepEqual((await run({ ...query, text: 'a', wholeWords: true }, records)).records, [
      { ref: ref(1), application: true, message: true }, { ref: ref(2), application: true, message: false },
    ]);
    const scope = { ref: ref(2), source: 'application', start: 0, end: 5 };
    const ranges = await run({ ...query, text: 'a', wholeWords: true }, records, { id: 8, scopes: [scope] });
    assert.deepEqual(ranges, { requestId, key, workerGeneration: 7, kind: 'ranges', interestId: 8,
      ranges: [{ ...scope, start: 3, end: 4 }], coverage: [{ scope, complete: true }] });
    const dense = Array.from({ length: 1000 }, (_, occurrence) => ({ ref: ref(occurrence), application: 'a '.repeat(50), message: 'a' }));
    assert.equal((await run({ ...query, text: 'a' }, dense)).records.length, 1000);
    const capped = await run({ ...query, text: 'a' }, dense, { id: 9, scopes: dense.map(record => ({ ref: record.ref, source: 'application', start: 0, end: 100 })) });
    assert.equal(capped.ranges.length, 4096);
    assert.equal(capped.coverage.at(-1).complete, false);
    const late = await run({ ...query, text: 'a' }, dense, { id: 10, scopes: [{ ref: ref(999), source: 'application', start: 98, end: 100 }] });
    assert.deepEqual(late.ranges, [{ ref: ref(999), source: 'application', start: 98, end: 99 }]);
    const started = performance.now();
    await worker.terminate();
    await exited;
    exitMs = performance.now() - started;
  } finally { clearTimeout(deadline); await worker.terminate(); }

  // A malformed/oversized request must fail before invoking the matcher. Wait
  // for actual exit, including this rejected-input path.
  const invalid = new Worker(source, { eval: true });
  const invalidExit = new Promise(resolve => invalid.once('exit', resolve));
  const invalidError = once(invalid, 'error');
  const invalidDeadline = setTimeout(() => { void invalid.terminate(); }, 10_000);
  try {
    await once(invalid, 'message');
    invalid.postMessage({ workerGeneration: 1, request: { requestId: 1, key,
      query: { text: 'a'.repeat(16385), matchCase: false, wholeWords: false }, records: [], work: 'match' } });
    assert.match(String((await invalidError)[0]), /Rejected invalid Find worker input/);
    assert.notEqual(await invalidExit, 0);
  } finally { clearTimeout(invalidDeadline); await invalid.terminate(); }
  return { version, operations: requestId, count: 1000, rangeCap: 4096, lateVisible: true, rejectedOversizedInput: true, actualExitMs: exitMs };
}
