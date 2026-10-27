import assert from 'node:assert/strict';
import test from 'node:test';
import { FindHistory } from '../src/core/find-history.ts';
import type { FindKey, FindQuery } from '../src/core/find-protocol.ts';

const key: FindKey = { viewerEpoch: 1, targetEpoch: 1, instanceEpoch: 1, windowRevision: 1, messageRevision: 1, queryRevision: 1 };
const query = (text: string, matchCase = false, wholeWords = false): FindQuery => ({ text, matchCase, wholeWords });
const ready = { phase: 'ready', key, records: [{}], composing: false };

test('history keeps seven exact text/two-flag tuples in MRU order, independently per viewer', () => {
  const history = new FindHistory();
  for (const text of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) history.commit(query(text), key, ready, 'navigate');
  assert.deepEqual(history.entries.map(entry => entry.text), ['h', 'g', 'f', 'e', 'd', 'c', 'b']);
  history.commit(query('d'), key, ready, 'close');
  history.commit(query('d', true), key, ready, 'navigate');
  history.commit(query('d', true, true), key, ready, 'navigate');
  assert.deepEqual(history.entries.slice(0, 3), [query('d', true, true), query('d', true), query('d')]);
  assert.deepEqual(new FindHistory().entries, []);
  history.clear(); assert.deepEqual(history.entries, []);
});

test('close commits valid zero hits; unfinished, composing, oversized, failed and stale inputs never commit', () => {
  const history = new FindHistory();
  const zero = { ...ready, records: [] };
  history.commit(query('zero'), key, zero, 'navigate');
  assert.equal(history.entries.length, 0);
  history.commit(query('zero'), key, zero, 'close');
  assert.deepEqual(history.entries, [query('zero')]);
  for (const phase of ['pending', 'empty', 'timeout', 'execution', 'too-long']) {
    history.commit(query(phase), key, { ...ready, phase }, 'close');
  }
  history.commit(query('composing'), key, { ...ready, composing: true }, 'close');
  history.commit(query('stale'), { ...key, queryRevision: 2 }, ready, 'close');
  history.commit(query('x'.repeat(16_385)), key, ready, 'close');
  history.commit(query(''), key, ready, 'close');
  assert.deepEqual(history.entries, [query('zero')]);
  history.commit(query('  '), key, ready, 'close');
  assert.equal(history.entries[0].text, '  ');
  history.clear(); assert.deepEqual(history.entries, []);
});
