// Isolated Node workers only. No installed host, GUI, clipboard or user store.
import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import { readFile } from 'node:fs/promises';
import { FindExecution } from '../src/main/find-execution.ts';

await import('./build.mjs');
const manifest = JSON.parse(await readFile('package.json', 'utf8'));
const asset = `out/find-worker-${manifest.version}.js`;
const source = await readFile(asset, 'utf8');
let live = 0, peak = 0, starts = 0, exits = 0;
const execution = new FindExecution(() => {
  const worker = new Worker(source, { eval: true });
  live++; starts++; peak = Math.max(peak, live);
  assert.equal(live, 1, 'Replacement overlapped an exiting worker');
  worker.once('exit', () => { live--; exits++; });
  return worker;
}, manifest.version);
let serial = 0;
const request = () => ({ requestId: ++serial,
  key: { viewerEpoch: 1, targetEpoch: 1, instanceEpoch: 1, windowRevision: 1, messageRevision: 1, queryRevision: serial },
  query: { text: 'σ', matchCase: false, wholeWords: true },
  records: [{ ref: { context: 'actual-worker-lifecycle', occurrence: 0 }, application: '\u0345Σ\u0345', message: 'Σ' }], work: 'match' });
const cancellationExitMs = [];
const deadline = setTimeout(() => { console.error('Worker lifecycle verification exceeded 30s'); process.exit(1); }, 30_000);
try {
  for (let cycle = 0; cycle < 20; cycle++) {
    const obsolete = execution.submit(request());
    const started = performance.now();
    const replacements = Array.from({ length: 20 }, () => execution.submit(request()));
    assert.equal(await obsolete, undefined);
    assert((await Promise.all(replacements.slice(0, -1))).every(value => value === undefined));
    const reply = await replacements.at(-1);
    assert.equal(reply.kind, 'matches');
    assert.deepEqual(reply.records, [{ ref: { context: 'actual-worker-lifecycle', occurrence: 0 }, application: true, message: true }]);
    cancellationExitMs.push(performance.now() - started);
    const beforeReuse = starts;
    assert.equal((await execution.submit(request())).kind, 'matches');
    assert.equal(starts, beforeReuse, 'Idle successful worker was not reused');
    await execution.setActive(false);
    assert.equal(live, 0, 'Inactivity returned before actual exit');
    await execution.setActive(true);
  }
  const startup = execution.submit(request());
  const stoppedAt = performance.now();
  await execution.dispose();
  assert.equal(await startup, undefined);
  const startupStopToExitMs = performance.now() - stoppedAt;
  assert.equal(live, 0); assert.equal(peak, 1); assert.equal(starts, exits);
  console.log(JSON.stringify({ package: `${manifest.name}@${manifest.version}`, asset, environment: process.versions,
    cycles: 20, requests: serial, starts, exits, peak, live, startupStopToExitMs,
    supersessionThroughLatestReplyMs: { max: Math.max(...cancellationExitMs), samples: cancellationExitMs },
    scope: 'Actual built worker with production scheduler; SDK/frame ownership, mounted Find and host soak remain unverified' }, null, 2));
} finally { clearTimeout(deadline); await execution.dispose(); }
