import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyWindow, replaceWindow, recordRef, recordIndex } from '../src/core/occurrences.ts';
import { parseTransportLine } from '../src/core/records.ts';

const lines = (values: string[]) => values.map(parseTransportLine);

test('every consumer retains the old x at the beginning, never the newly appended x', () => {
  const old = replaceWindow(emptyWindow('viewer/target/instance-1'), lines(['start', 'x', 'end']));
  const inspection = recordRef(old, 1);
  const next = replaceWindow(old, lines(['x', 'end', 'x']));
  assert.equal(recordIndex(next, inspection), 0);
  assert.equal(recordRef(next, 0), inspection);
  assert.notDeepEqual(recordRef(next, 2), inspection);
  assert.equal(recordIndex(next, recordRef(old, 0)), -1);
});

test('eviction, empty and zero-overlap windows expire references permanently, even if text returns', () => {
  const old = replaceWindow(emptyWindow('context'), lines(['a', 'x', 'end']));
  const ref = recordRef(old, 1);
  for (const values of [[], ['unrelated', 'x']]) {
    const departed = replaceWindow(old, lines(values));
    assert.equal(recordIndex(departed, ref), -1);
    const returned = replaceWindow(departed, lines(['a', 'x', 'end']));
    assert.equal(recordIndex(returned, ref), -1);
  }
});

test('identical windows preserve every observed ID and new contexts reject old references', () => {
  const old = replaceWindow(emptyWindow('context-1'), lines(['x', 'x', 'x']));
  const identical = replaceWindow(old, lines(['x', 'x', 'x']));
  assert.deepEqual(identical.refs, old.refs);
  const shorter = replaceWindow(identical, lines(['x', 'x']));
  assert.equal(recordIndex(shorter, recordRef(old, 0)), -1);
  assert.equal(recordIndex(shorter, recordRef(old, 1)), 0);
  const other = replaceWindow(emptyWindow('context-2'), lines(['x', 'x', 'x']));
  assert.equal(recordIndex(other, recordRef(old, 1)), -1);
  assert.equal(recordRef(other, 99), undefined);
});
