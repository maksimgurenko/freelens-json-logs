// Production main + trusted worker through the SDK boundary in an isolated
// --expose-gc process. No installed host, desktop or user settings.
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { packedFindBridge } from '../../scripts/find-test-bridge.mjs';
import { retainSnapshot, ORIGINAL_TEXT_BUDGET } from '../../src/core/snapshot.ts';

assert.equal(typeof global.gc, 'function');
const bridge = packedFindBridge(process.argv[2], process.cwd());
const turn = () => new Promise(resolve => setImmediate(resolve));
const limits = { heapUsed: 12 * 1024 ** 2, external: 8 * 1024 ** 2, rss: 96 * 1024 ** 2 };
const latency = [], stopToExitMs = [];
let cycles = 0;
function records(single, revision) {
  // Exact UTF-8 bounds, built with actual production retention. No extra copy
  // or synthetic cap replaces the 5 MiB source / 1000-record contracts.
  const prefix = `needle ${revision} `;
  const line = prefix + 'a '.repeat(Math.floor((5241 - prefix.length) / 2));
  const response = single ? 'a '.repeat(ORIGINAL_TEXT_BUDGET / 2) : Array(1000).fill(line).join('\n');
  const snapshot = retainSnapshot(response);
  assert.equal(snapshot.records.length, single ? 1 : 1000);
  assert(single ? snapshot.retainedBytes === ORIGINAL_TEXT_BUDGET : snapshot.retainedBytes > ORIGINAL_TEXT_BUDGET * 0.99);
  return snapshot.records.map((record, occurrence) => ({ ref: { context: `cycle-${revision}`, occurrence }, application: record.applicationText }));
}
async function cycle() {
  const single = cycles % 2 === 0, revision = ++cycles;
  const token = await bridge.invoke('find-open', ['resource-viewer']);
  let id = 0;
  const request = (queryRevision, input, work = 'match', interest = 1) => ({ requestId: ++id,
    key: { viewerEpoch: revision, targetEpoch: 1, instanceEpoch: 1, windowRevision: queryRevision, messageRevision: queryRevision, queryRevision },
    query: { text: single ? 'a' : 'needle', matchCase: false, wholeWords: false }, records: input, work,
    ...(work === 'ranges' ? { rangeInterest: { id: interest, scopes: [{ ref: input.at(-1).ref, source: 'application', start: 0, end: input.at(-1).application.length }] } } : {}) });
  const current = records(single, revision);
  const obsolete = bridge.invoke('find-request', [token, request(1, current)]);
  // Supersede before ready, then replace window/message/query inputs together.
  const replacements = Array.from({ length: 12 }, (_, index) => bridge.invoke('find-request', [token, request(index + 2, current)]));
  assert.equal(await obsolete, undefined);
  assert((await Promise.all(replacements.slice(0, -1))).every(reply => reply === undefined));
  const last = await replacements.at(-1);
  assert.equal(last.kind, 'matches'); assert.equal(last.records.length, single ? 1 : 1000);
  // Range-interest churn cannot starve matching or retain a backlog of sources.
  const started = performance.now();
  const exact = bridge.invoke('find-request', [token, request(14, current)]);
  const ranges = Array.from({ length: 12 }, (_, index) => bridge.invoke('find-request', [token, request(14, current, 'ranges', index + 1)]));
  assert.equal((await exact).records.length, single ? 1 : 1000);
  assert((await Promise.all(ranges.slice(0, -1))).every(reply => reply === undefined));
  const decorated = await ranges.at(-1);
  assert.equal(decorated.kind, 'ranges'); assert(decorated.ranges.length <= 4096);
  if (single) { assert.equal(decorated.ranges.length, 4096); assert.equal(decorated.coverage[0].complete, false); }
  latency.push(performance.now() - started);
  const stopped = performance.now();
  await bridge.invoke('find-control', [token, 'active', false]);
  stopToExitMs.push(performance.now() - stopped);
  assert.equal(bridge.status().live, 0, 'Inactivity returned before actual exit');
  await bridge.invoke('find-control', [token, 'active', true]);
  assert.equal((await bridge.invoke('find-request', [token, request(15, current)])).kind, 'matches');
  await bridge.invoke('find-control', [token, 'close']);
  await turn();
  const state = bridge.status();
  assert.equal(state.owners, 0); assert.equal(state.inflight, 0);
  assert.equal(state.queuedTransport, 0);
  assert.equal(state.live, 0); assert.equal(state.starts, state.exits);
  assert.equal(state.senderListeners, 0); assert.equal(state.workerListenersAfterExit, 0);
  assert.equal(state.peak, 1, 'Replacement overlapped an exiting worker');
}
async function measure() {
  await turn(); global.gc(); await turn(); global.gc();
  const { heapUsed, external, rss } = process.memoryUsage();
  const active = process.getActiveResourcesInfo();
  return { heapUsed, external, rss, timers: active.filter(name => name === 'Timeout').length,
    ports: active.filter(name => name === 'MessagePort').length,
    threads: process.platform === 'linux' ? readdirSync('/proc/self/task').length : null };
}
try {
  for (let i = 0; i < 4; i++) await cycle();
  const samples = [await measure()];
  for (let batch = 0; batch < 4; batch++) {
    for (let i = 0; i < 4; i++) await cycle();
    const sample = await measure(); samples.push(sample);
    for (const [metric, budget] of Object.entries(limits)) assert(sample[metric] - samples[0][metric] <= budget, `${metric} grew: ${JSON.stringify(samples)}`);
    for (const metric of ['timers', 'ports', 'threads']) assert.equal(sample[metric], samples[0][metric], `${metric} retained after actual exit`);
  }
  await bridge.dispose();
  console.log(JSON.stringify({ check: 'production main/worker retention and resource churn', cycles, limits, samples,
    lifecycle: bridge.status(), stopToExitMs, matchingAndRangeMs: latency,
    scope: 'Real built workers and production SDK handlers; host/frame tree are stand-ins, not installed-host soak or native input' }, null, 2));
} finally { await bridge.dispose(); }
