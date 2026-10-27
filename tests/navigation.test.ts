import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findMatches, moveMatch, windowOverlap } from '../src/core/navigation.ts';
import { emptyWindow, replaceWindow, recordIndex, recordRef } from '../src/core/occurrences.ts';
import type { LogRecord } from '../src/core/records.ts';
import { formatDefault, parseTransportLine } from '../src/core/records.ts';

const records = (lines: string[]) => lines.map(parseTransportLine);
const retainedIndex = (previous: readonly LogRecord[], next: readonly LogRecord[], index: number) => {
  const old = replaceWindow(emptyWindow('navigation'), previous);
  return recordIndex(replaceWindow(old, next), recordRef(old, index));
};

test('ordered overlap preserves the correct repeated occurrence and reports the departed one lost', () => {
  const old = records(['before', 'repeat', 'repeat', 'after']);
  const next = records(['repeat', 'after', 'new']);
  assert.equal(windowOverlap(old, next), 2);
  assert.equal(retainedIndex(old, next, 1), -1);
  assert.equal(retainedIndex(old, next, 2), 0);
  const both = records(['repeat', 'repeat', 'after', 'new']);
  assert.equal(retainedIndex(old, both, 1), 0);
  assert.equal(retainedIndex(old, both, 2), 1);
});

test('append, unchanged, lost, empty, invalid index and periodic windows retain only observed overlap', () => {
  const old = records(['a', 'b', 'a', 'b']);
  assert.equal(windowOverlap(old, records(['a', 'b', 'c'])), 2);
  assert.equal(retainedIndex(old, records(['a', 'b', 'c']), 2), 0);
  assert.equal(retainedIndex(old, old, 1), 1);
  assert.equal(retainedIndex(old, records(['a', 'b', 'a', 'b', 'new']), 1), 1);
  assert.equal(retainedIndex(old, records(['else']), 1), -1);
  assert.equal(retainedIndex(old, [], 1), -1);
  assert.equal(retainedIndex([], old, -1), -1);
  assert.equal(retainedIndex(old, old, 99), -1);
  assert.equal(windowOverlap(records(['x', 'x', 'x']), records(['x', 'x'])), 2);
  assert.equal(windowOverlap([], old), 0);
});

test('Find shares literal case-insensitive predicate for originals and decoded messages, once per record', () => {
  const input = records([
    '2026-10-22T01:02:03.123456789Z {"message":"A\\nB \\u03b1", "hidden":"Private.Needle[0]"}',
    '2026-10-22T01:02:03.123456789Z {"message":"needle", "hidden":"needle"}',
    '2026-10-22T01:02:03.123456789Z plain NEEDLE',
    '2026-10-22T01:02:03.123456789Z ',
  ]);
  const messages = input.map(record => formatDefault(record).message);
  const before = JSON.stringify(input);
  assert.deepEqual(findMatches(input, messages, 'a\nb α'), [0]);
  assert.deepEqual(findMatches(input, messages, 'PRIVATE.NEEDLE[0]'), [0]);
  assert.deepEqual(findMatches(input, messages, 'needle'), [0, 1, 2]);
  assert.deepEqual(findMatches(input, messages, '.*'), []);
  assert.deepEqual(findMatches(input, messages, '01:02:03.123456789'), []);
  assert.deepEqual(findMatches(input, messages, ''), []);
  assert.deepEqual(findMatches(input, messages, 'absent'), []);
  assert.deepEqual(findMatches(input, messages, ' '), [0, 1, 2]);
  assert.equal(JSON.stringify(input), before);
});

test('Previous/Next visit precisely the counted records and wrap without filtering', () => {
  const input = records(['hit', 'miss', 'HIT', 'hit']);
  const matches = findMatches(input, input.map(r => r.applicationText), 'hit');
  assert.deepEqual(matches, [0, 2, 3]);
  let current = -1;
  const visited = [];
  for (let i = 0; i < matches.length; i++) { current = moveMatch(matches, current, 1); visited.push(current); }
  assert.deepEqual(visited, matches);
  assert.equal(moveMatch(matches, current, 1), 0);
  assert.equal(moveMatch(matches, 0, -1), 3);
  assert.equal(moveMatch(matches, -1, -1), 3);
  assert.equal(moveMatch([], 0, 1), -1);
  assert.equal(input.length, 4);
});

test('window replacement and reformatting recompute Find from originals and the active extracted message', () => {
  const input = records(['{"message":"old","custom":"\\u03b1"}', 'gone']);
  assert.deepEqual(findMatches(input, input.map(r => formatDefault(r).message), 'α'), []);
  // A later profile may extract/decode custom instead; navigation accepts the
  // active formatted messages rather than hard-coding Default or display text.
  assert.deepEqual(findMatches(input, ['α', 'gone'], 'α'), [0]);
  assert.deepEqual(findMatches(records(['new']), ['new'], 'gone'), []);
});

test('overlap mapping agrees with a simple exhaustive oracle including repeated lines', () => {
  const sequences = [[], ['a'], ['b']];
  for (let length = 2; length <= 5; length++) {
    for (let bits = 0; bits < 2 ** length; bits++) sequences.push(Array.from({ length }, (_, i) => bits & (1 << i) ? 'a' : 'b'));
  }
  for (const a of sequences) for (const b of sequences) {
    let expected = 0;
    for (let size = 1; size <= Math.min(a.length, b.length); size++) {
      if (a.slice(-size).every((value, index) => value === b[index])) expected = size;
    }
    assert.equal(windowOverlap(records(a), records(b)), expected);
  }
});
