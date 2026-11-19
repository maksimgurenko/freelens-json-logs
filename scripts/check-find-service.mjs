import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { packedFindBridge } from './find-test-bridge.mjs';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const profile = id => ({ id, name: id,
  format: { messagePaths: [], timestampPaths: [], levelPaths: [], inlinePaths: [], hiddenPaths: [], numericTimestamp: 'unset', severityMappings: [] },
  matching: { enabled: false, conditions: { labels: [] } } });

async function checkSettingsCommands(bridge) {
  const mutate = mutation => bridge.invoke('readable-logs-settings-mutate', [mutation], 0);
  const persisted = () => JSON.parse(readFileSync(bridge.settingsPath));
  const ids = () => persisted().profiles.map(({ id }) => id);
  // Main receives the next action while the first caller is still awaiting Save.
  const save = mutate({ type: 'save-profile', profile: profile('retained') });
  assert.deepEqual(ids(), ['retained']);
  assert.equal(persisted().viewer.inspection, 'side');
  const inspection = mutate({ type: 'inspection', layout: 'bottom' });
  await Promise.all([save, inspection]);
  assert.deepEqual(ids(), ['retained'], 'A later Inspection command discarded an acknowledged profile');
  assert.equal(persisted().viewer.inspection, 'bottom');

  await mutate({ type: 'save-profile', profile: profile('second') });
  await mutate({ type: 'move-profile', id: 'second', direction: -1 });
  await mutate({ type: 'global-default', id: 'second' });
  assert.deepEqual(ids(), ['second', 'retained']);
  assert.equal(persisted().globalDefault, 'second');
  await mutate({ type: 'delete-profile', id: 'second' });
  assert.deepEqual(ids(), ['retained']);
  assert.notEqual(persisted().globalDefault, 'second');
  assert.throws(() => mutate({ type: 'move-profile', id: 'retained', direction: 0 }), /Invalid.*settings mutation/i);

  bridge.rejectNextSettingsWrite();
  assert.throws(() => mutate({ type: 'save-profile', profile: profile('failed') }), /Unable to write Readable logs settings/i);
  assert.deepEqual(ids(), ['retained'], 'A failed write was acknowledged or retained in the saved settings');
  await mutate({ type: 'inspection', layout: 'inline' });
  assert.deepEqual(ids(), ['retained'], 'A later command republished the failed profile');

  const future = Buffer.from(JSON.stringify({ ...persisted(), schemaVersion: 999 }));
  writeFileSync(bridge.settingsPath, future);
  assert.throws(() => mutate({ type: 'inspection', layout: 'side' }), /Unsupported configuration schema 999/);
  assert.deepEqual(readFileSync(bridge.settingsPath), future);
  assert.match(bridge.broadcasts.at(-1)[1].problem, /Unsupported configuration schema 999/);
  const reset = await bridge.invoke('readable-logs-settings-reset', [true], 0);
  assert.deepEqual(readFileSync(reset.backup), future);
  assert.deepEqual(ids(), []);
  assert.equal(persisted().viewer.inspection, 'side');
}

/** Actual packed main/worker; SDK/Electron/frame tree are explicit test doubles. */
export async function checkPackedFindService(entry, settingsDirectory) {
  const bridge = packedFindBridge(entry, settingsDirectory);
  const request = id => ({ requestId: id, key: { viewerEpoch: 1, targetEpoch: 1, instanceEpoch: 1, windowRevision: 1, messageRevision: 1, queryRevision: id },
    query: { text: 'K', matchCase: false, wholeWords: true }, records: [{ ref: { context: 'one', occurrence: 0 }, application: 'K K', message: 'K' }], work: 'match' });
  let stopToExitMs, pending, rejectedLateCalls = false;
  try {
    await checkSettingsCommands(bridge);
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

    const viewerToken = await bridge.invoke('find-open', ['deactivating-viewer'], 0);
    await bridge.invoke('viewer-visibility-request', ['cluster', 'viewer-visibility-existing'], 0);
    assert.deepEqual(bridge.broadcasts.at(-1), ['viewer-visibility-changed', 'viewer-visibility-existing', 'cluster']);
    pending = bridge.invoke('find-request', [viewerToken, request(1)], 0);
    assert.equal(bridge.status().live, 1, 'Expected a live worker at deactivation');
    assert.equal(bridge.status().appListeners, 0, 'Activation registered an application quit hook');
  } finally {
    const before = bridge.status();
    const disposing = bridge.dispose();
    try {
      if (pending) {
        assert.equal(bridge.status().live, 1, 'Worker exited before the deactivation race was exercised');
        for (const [channel, args] of [
          ['readable-logs-settings-status', []],
          ['readable-logs-settings-mutate', [{ type: 'save-profile', profile: profile('late') }]],
          ['readable-logs-settings-reset', [true]],
          ['viewer-visibility-request', ['cluster', 'viewer-visibility-late']],
        ]) assert.throws(() => bridge.invoke(channel, args, 0), /deactivating/i, channel);
        await bridge.invoke('viewer-visibility-stop', ['viewer-visibility-existing'], 0);
        const during = bridge.status();
        assert.equal(during.storeBindings, before.storeBindings, 'Late settings call rebound the settings store');
        assert.equal(during.registrations, before.registrations, 'Late calls registered duplicate handlers');
        assert.equal(during.starts, before.starts, 'Late calls started another Find worker');
        assert.equal(during.windowListeners, 0, 'Late visibility request registered window listeners');
        assert.equal(during.senderListeners, 0, 'Late visibility request registered sender listeners');
        assert.deepEqual(JSON.parse(readFileSync(bridge.settingsPath)).profiles, [], 'Late settings call changed saved profiles');
        rejectedLateCalls = true;
      }
    } finally { await disposing; }
  }
  assert.equal(await pending, undefined, 'Deactivation delivered an obsolete result');
  const lifecycle = bridge.status(); assert.equal(lifecycle.starts, lifecycle.exits); assert.equal(lifecycle.peak, 1);
  return { scope: 'actual packed main + trusted worker; SDK/Electron/frame-tree stand-ins', ...lifecycle,
    idleStopToActualExitMs: stopToExitMs, rejectedLateCalls, settingsCommands: 'ordered persistence, failed writes, schema preflight and exact reset backup' };
}
