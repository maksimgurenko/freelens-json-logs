import test from 'node:test';
import assert from 'node:assert/strict';
import { OrderedFindTransport } from '../scripts/find-test-bridge.mjs';

test('HTTP stand-in preserves SDK invocation order without waiting for earlier replies', async () => {
  const transport = new OrderedFindTransport();
  let complete;
  const calls = [];
  // A small cancel body can finish uploading before an earlier large request.
  const cancel = transport.dispatch(2, () => { calls.push('cancel'); return 'stopped'; });
  assert.deepEqual(calls, []);
  const match = transport.dispatch(1, () => { calls.push('match'); return new Promise(resolve => { complete = resolve; }); });
  assert.deepEqual(calls, ['match', 'cancel']);
  assert.equal(await cancel, 'stopped');
  complete('old result'); assert.equal(await match, 'old result');
  assert.equal(transport.pending, 0); transport.dispose();
});

test('transport rejects stale/invalid sequences and releases missing-message timers on disposal', async () => {
  const transport = new OrderedFindTransport();
  await assert.rejects(transport.dispatch(0, () => {}), /sequence/);
  await transport.dispatch(1, () => {});
  await assert.rejects(transport.dispatch(1, () => {}), /sequence/);
  const gap = transport.dispatch(3, () => { throw new Error('must never dispatch'); });
  assert.equal(transport.pending, 1); transport.dispose();
  await assert.rejects(gap, /disposed/); assert.equal(transport.pending, 0);
});
