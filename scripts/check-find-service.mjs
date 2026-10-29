import assert from 'node:assert/strict';
import { packedFindBridge } from './find-test-bridge.mjs';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/** Actual packed main/worker; SDK/Electron/frame tree are explicit test doubles. */
export async function checkPackedFindService(entry, settingsDirectory) {
  const bridge = packedFindBridge(entry, settingsDirectory);
  const request = id => ({ requestId: id, key: { viewerEpoch: 1, targetEpoch: 1, instanceEpoch: 1, windowRevision: 1, messageRevision: 1, queryRevision: id },
    query: { text: 'K', matchCase: false, wholeWords: true }, records: [{ ref: { context: 'one', occurrence: 0 }, application: 'K K', message: 'K' }], work: 'match' });
  let stopToExitMs;
  try {
    const root = await bridge.invoke('find-open', ['viewer'], 0);
    const child = await bridge.invoke('find-open', ['viewer'], 1);
    assert.throws(() => bridge.invoke('find-request', [root, request(1)], 1), /Foreign or disposed/);
    assert.throws(() => bridge.invoke('find-request', [child, request(1)], 0), /Foreign or disposed/);
    const first = await bridge.invoke('find-request', [child, request(1)]);
    assert.equal(first.kind, 'matches');
    assert.deepEqual(first.records, [{ ref: request(1).records[0].ref, application: true, message: true }]);
    const ranges = await bridge.invoke('find-request', [child, { ...request(2), work: 'ranges', rangeInterest: { id: 1,
      scopes: [{ ref: request(2).records[0].ref, source: 'application', start: 0, end: 3 }] } }]);
    assert.equal(ranges.kind, 'ranges'); assert.deepEqual(ranges.ranges.map(range => [range.start, range.end]), [[0, 1], [2, 3]]);
    assert.equal(bridge.status().starts, 1, 'Successful matching/ranges did not reuse worker');
    const started = performance.now();
    await bridge.invoke('find-control', [child, 'active', false]);
    stopToExitMs = performance.now() - started;
    assert.equal(bridge.status().live, 0);
    await bridge.invoke('find-control', [child, 'active', true]);
    const duringStartup = bridge.invoke('find-request', [child, request(3)]);
    const replaced = await bridge.invoke('find-open', ['viewer']);
    assert.equal(await duringStartup, undefined);
    assert.equal(bridge.status().live, 0, 'Replacement returned before old exit');
    assert.throws(() => bridge.invoke('find-request', [child, request(4)]), /Foreign or disposed/);
    assert.equal((await bridge.invoke('find-request', [replaced, request(1)])).kind, 'matches');
    bridge.removeFrame(1);
    for (let i = 0; bridge.status().live && i < 250; i++) await sleep(10);
    assert.equal(bridge.status().live, 0, 'Missing frame retained worker');
    assert.throws(() => bridge.invoke('find-request', [replaced, request(2)]), /Foreign or disposed/);
    // Root ownership survives removal of the child frame.
    assert.equal((await bridge.invoke('find-request', [root, request(1)], 0)).kind, 'matches');
    await bridge.invoke('find-control', [root, 'close'], 0);
    assert.equal(bridge.status().live, 0);
  } finally { await bridge.dispose(); }
  const lifecycle = bridge.status(); assert.equal(lifecycle.starts, lifecycle.exits); assert.equal(lifecycle.peak, 1);
  return { scope: 'actual packed main + trusted worker; SDK/Electron/frame-tree stand-ins', ...lifecycle, idleStopToActualExitMs: stopToExitMs };
}
