import assert from 'node:assert/strict';
import test from 'node:test';
import { LocalDismissal } from '../src/renderer/local-dismissal.ts';

test('one dismissal resolves the highest eligible layer, then Find, then inspection; disposal removes ownership', () => {
  const layers = new LocalDismissal();
  let historyOpen = true, findOpen = true, inspected = true;
  const events: string[] = [];
  const stopInspector = layers.add(0, () => inspected ? () => { inspected = false; events.push('inspection'); } : undefined);
  const stopFind = layers.add(10, () => findOpen ? () => { findOpen = false; events.push('Find'); } : undefined);
  const stopHistory = layers.add(200, () => historyOpen ? () => { historyOpen = false; events.push('history'); } : undefined);
  layers.resolve()?.();
  assert.deepEqual(events, ['history']); assert.equal(findOpen, true); assert.equal(inspected, true);
  layers.resolve()?.(); assert.deepEqual(events, ['history', 'Find']); assert.equal(inspected, true);
  layers.resolve()?.(); assert.deepEqual(events, ['history', 'Find', 'inspection']);
  assert.equal(layers.resolve(), undefined);
  historyOpen = true; stopHistory(); stopHistory(); stopFind(); stopInspector();
  assert.equal(layers.resolve(), undefined);
});
