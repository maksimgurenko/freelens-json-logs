import test from 'node:test';
import assert from 'node:assert/strict';
import { sourceFragments } from '../src/core/find-presentation.ts';

test('complete source fragments retain UTF-16 offsets without splitting surrogate pairs', () => {
  const text = 'a'.repeat(8191) + '😀banana' + 'b'.repeat(8193);
  const fragments = sourceFragments(text);
  assert.equal(fragments.map(fragment => fragment.text).join(''), text);
  assert.equal(fragments[0].text.length, 8191);
  assert.equal(fragments[1].start, 8191);
  assert.equal(fragments[1].text.slice(0, 2), '😀');
  assert(fragments.every(fragment => fragment.text.length <= 8192));
});
