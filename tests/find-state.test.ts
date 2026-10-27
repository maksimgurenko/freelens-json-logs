import assert from 'node:assert/strict';
import test from 'node:test';
import { FindPosition } from '../src/core/find-state.ts';
import { emptyWindow, replaceWindow } from '../src/core/occurrences.ts';
import { parseTransportLine } from '../src/core/records.ts';
import type { FindKey } from '../src/core/find-protocol.ts';

const window = replaceWindow(emptyWindow('state-trace'), Array.from({ length: 100 }, (_, i) => parseTransportLine(`row ${i}`)));
const key = (revision: number): FindKey => ({ viewerEpoch: 1, targetEpoch: 1, instanceEpoch: 1,
  windowRevision: 1, messageRevision: 1, queryRevision: revision });
const hits = [2, 73, 82, 90].map(i => window.refs[i]);

test('reading row 64: refinement stays 73, Next reaches 82, typo correction restores 82, replacement rebases', () => {
  const find = new FindPosition();
  find.read(window.refs[64]);
  find.prepare(window, key(1), 'new'); find.accept(key(1), hits);
  assert.equal(find.active, window.refs[73]);
  find.prepare(window, key(2), 'refine'); find.accept(key(2), hits);
  assert.equal(find.active, window.refs[73]);
  find.navigate(1); assert.equal(find.active, window.refs[82]);
  find.prepare(window, key(3), 'refine'); find.accept(key(3), []);
  assert.equal(find.active, undefined); assert.equal(find.candidate, window.refs[82]);
  find.prepare(window, key(4), 'refine'); find.accept(key(4), hits);
  assert.equal(find.active, window.refs[82]);
  find.prepare(window, key(5), 'new'); find.accept(key(5), hits);
  assert.equal(find.active, window.refs[73]);
});

test('deliberate reading rebases navigation inclusively; edge and one-hit feedback', () => {
  const find = new FindPosition();
  find.prepare(window, key(1), 'maintenance'); find.accept(key(1), hits);
  find.navigate(-1); assert.equal(find.active, window.refs[90]);
  find.navigate(1); assert.equal(find.active, window.refs[2]);
  assert.equal(find.feedback, 'Wrapped to beginning');
  find.navigate(-1); assert.equal(find.feedback, 'Wrapped to end');
  find.read(window.refs[82]); find.navigate(-1);
  assert.equal(find.active, window.refs[82]);
  find.read(window.refs[80]); find.navigate(1);
  assert.equal(find.active, window.refs[82]);
  find.prepare(window, key(2), 'maintenance'); find.accept(key(2), [window.refs[82]]);
  find.navigate(1); assert.equal(find.feedback, 'Only matching record');
});

test('scroll cancels only reveal, dismissal/inspection cancels selection; current counts remain useful', () => {
  const find = new FindPosition();
  find.read(window.refs[64]); find.prepare(window, key(1), 'new');
  find.cancelReveal(); find.accept(key(1), hits);
  assert.equal(find.active, window.refs[73]);
  assert.equal(find.takeReveal(window, key(1)), undefined);
  find.navigate(1);
  assert.equal(find.takeReveal(window, key(1)), window.refs[82]);
  assert.equal(find.takeReveal(window, key(1)), undefined);
  find.prepare(window, key(2), 'new'); find.closeInspection(window.refs[64]); find.accept(key(2), hits);
  assert.equal(find.reading, undefined); assert.equal(find.active, undefined);
  find.navigate(-1); assert.equal(find.active, window.refs[90]);
  find.read(window.refs[73]); find.closeInspection(window.refs[64]);
  assert.equal(find.reading, window.refs[73]);
});

test('maintenance retains surviving hits, never replaces them, and expiry cannot revive equal text', () => {
  const find = new FindPosition();
  find.prepare(window, key(1), 'new'); find.accept(key(1), hits);
  find.takeReveal(window, key(1));
  find.prepare(window, key(2), 'maintenance'); find.accept(key(2), hits);
  assert.equal(find.active, window.refs[2]); assert.equal(find.takeReveal(window, key(2)), undefined);
  find.prepare(window, key(3), 'maintenance'); find.accept(key(3), hits.slice(1));
  assert.equal(find.active, undefined);
  find.prepare(window, key(4), 'maintenance'); find.accept(key(4), hits);
  assert.equal(find.active, undefined);
  const next = replaceWindow(window, [parseTransportLine('brand new'), parseTransportLine('row 2')]);
  find.read(window.refs[2]); find.prepare(next, key(5), 'maintenance'); find.accept(key(5), [next.refs[1]]);
  assert.equal(find.reading, undefined); assert.equal(find.candidate, undefined);
  find.navigate(1); assert.equal(find.active, next.refs[1]);
});

test('every old input-key dimension is rejected and dismissed counts cannot promote a candidate', () => {
  for (const dimension of Object.keys(key(1)) as (keyof FindKey)[]) {
    const find = new FindPosition(), next = { ...key(1), [dimension]: 2 };
    find.prepare(window, key(1), 'new'); find.prepare(window, next, 'new');
    find.accept(key(1), hits); assert.equal(find.active, undefined, dimension);
    find.accept(next, hits); assert.equal(find.active, window.refs[2], dimension);
    assert.equal(find.takeReveal(window, key(1)), undefined, dimension);
  }
  const find = new FindPosition();
  find.prepare(window, key(1), 'new'); find.accept(key(1), hits); find.navigate(1);
  find.prepare(window, key(2), 'refine'); find.accept(key(2), []);
  find.prepare(window, key(3), 'refine'); find.cancelSelection(); find.accept(key(3), hits);
  assert.equal(find.active, undefined); assert.equal(find.candidate, window.refs[73]);
  assert.equal(find.takeReveal(window, key(3)), undefined);
  find.clear(); assert.equal(find.candidate, undefined); assert.equal(find.position, undefined);
  find.read(window.refs[64]); find.reset(); assert.equal(find.reading, undefined);
});
