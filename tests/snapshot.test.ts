import { test } from 'node:test';
import assert from 'node:assert/strict';
import { retainSnapshot, ORIGINAL_TEXT_BUDGET as BUDGET } from '../src/core/snapshot.ts';
const lines = (s: string) => retainSnapshot(s).records.map(record => record.transportLine);

test('blank-line/terminal separator examples and independent multiline records', () => {
  assert.deepEqual(lines(''), []);
  assert.deepEqual(lines('a\n'), ['a']);
  assert.deepEqual(lines('a\n\n'), ['a', '']);
  assert.deepEqual(lines('\n'), ['']);
  assert.deepEqual(lines('\n\n'), ['', '']);
  assert.deepEqual(lines('a\r\nb\r\n'), ['a\r', 'b\r']);
  assert.deepEqual(lines('Error: failed\n    at worker()\n'), ['Error: failed', '    at worker()']);
  assert.equal(lines('{"msg":"first\\nsecond"}\n').length, 1);
});

test('latest 1,000-line boundary, over-tail input and repeated identical lines remain in order', () => {
  const original = Array.from({ length: 1000 }, (_, i) => i % 2 ? 'repeat' : String(i));
  const atBoundary = retainSnapshot(original.join('\n') + '\n');
  assert.deepEqual(atBoundary.records.map(r => r.transportLine), original);
  assert.equal(atBoundary.omittedLines, 0);
  const over = retainSnapshot('older\n' + original.join('\n') + '\n');
  assert.deepEqual(over.records.map(r => r.transportLine), original);
  assert.equal(over.omittedLines, 1);
  assert.equal(over.returnedLines, 1001);
  assert.equal(over.retainedBytes, Buffer.byteLength(original.join('\n') + '\n'));
});

test('UTF-8 exactly/near/over 5 MiB: retain newest complete-line suffix and exact originals', () => {
  const text = '🙂'.repeat((BUDGET - 4) / 4) + 'abc'; // 5 MiB minus the final LF.
  const exact = retainSnapshot(text + '\n');
  assert.equal(exact.retainedBytes, BUDGET);
  assert.equal(exact.records[0].transportLine, text);
  const near = retainSnapshot('🙂'.repeat((BUDGET - 4) / 4));
  assert.equal(near.retainedBytes, BUDGET - 4);
  const over = retainSnapshot('old\n' + text + '\n');
  assert.equal(over.records.length, 1);
  assert.equal(over.records[0].applicationText, text);
  assert.equal(over.retainedBytes, BUDGET);
  assert.equal(over.omittedLines, 1);
  assert.equal(over.oversizedNewest, false);
  const noSkipping = retainSnapshot('small\n' + 'x'.repeat(BUDGET) + '\nnew\n');
  assert.deepEqual(noSkipping.records.map(r => r.transportLine), ['new']);
  assert.equal(noSkipping.omittedLines, 2);
});

test('oversized newest record is distinct from empty success; never keep a non-suffix older record', () => {
  for (const suffix of ['x'.repeat(BUDGET + 1), '🙂'.repeat(BUDGET / 4 + 1), 'x'.repeat(BUDGET) + '\n']) {
    const result = retainSnapshot('older\n' + suffix);
    assert.equal(result.oversizedNewest, true);
    assert.equal(result.records.length, 0);
    assert.equal(result.returnedLines, 2);
    assert.equal(result.omittedLines, 2);
  }
  assert.equal(retainSnapshot('').oversizedNewest, false);
});

test('timestamp prefixes count toward budget; parsed Unicode source and whitespace stay exact', () => {
  const original = '2026-10-21T12:00:00.123456789Z { "msg" : "α🙂", "x": [1,2] }\r';
  const result = retainSnapshot(original + '\n' + original + '\n');
  assert.equal(result.retainedBytes, Buffer.byteLength(original + '\n' + original + '\n'));
  assert.deepEqual(result.records.map(r => r.transportLine), [original, original]);
  assert.deepEqual(result.records[0].parsed, { msg: 'α🙂', x: [1, 2] });
});
