import assert from 'node:assert/strict';
import test from 'node:test';
import { eligibleFindSeed } from '../src/core/find-selection.ts';

test('selection seeds preserve exact single-line text and count Unicode code points', () => {
  assert.equal(eligibleFindSeed('  literal .*  '), '  literal .*  ');
  assert.equal(eligibleFindSeed('😀'.repeat(256)), '😀'.repeat(256));
  assert.equal(eligibleFindSeed('😀'.repeat(257)), undefined);
  for (const text of ['', 'a\nb', 'a\rb', 'a\u2028b', 'a\u2029b']) assert.equal(eligibleFindSeed(text), undefined);
});
