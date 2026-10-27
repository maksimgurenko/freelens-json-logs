import test from 'node:test';
import assert from 'node:assert/strict';
import { matchingRecords, sourceRanges } from '../src/core/find-matcher.ts';
import type { FindQuery, FindRecord } from '../src/core/find-protocol.ts';

const query = (text: string, matchCase = false, wholeWords = false): FindQuery => ({ text, matchCase, wholeWords });
const record = (occurrence: number, application: string, message?: string): FindRecord => ({
  ref: { context: 'viewer/target/instance', occurrence }, application, message,
});

test('ranges retain original UTF-16 offsets and whole-source non-overlap across fragments', () => {
  const records = [record(0, '😀banana', 'a\na'), record(1, 'ana')];
  const scopes = [
    { ref: records[0].ref, source: 'application' as const, start: 5, end: 8 },
    { ref: records[0].ref, source: 'application' as const, start: 2, end: 5 },
  ];
  assert.deepEqual(sourceRanges(records, query('ana'), scopes), {
    ranges: [{ ref: records[0].ref, source: 'application', start: 3, end: 6 }],
    coverage: scopes.map(scope => ({ scope, complete: true })),
  });
  // A substring restart at 5 would incorrectly choose the overlapping second ana.
  assert.deepEqual(sourceRanges(records, query('ana'), [scopes[0]]).ranges, [
    { ref: records[0].ref, source: 'application', start: 3, end: 6 },
  ]);
});

test('literal Find returns complete ordered records with independent source provenance', () => {
  const records = [record(0, '2026 ordinary application'), record(1, '{"message":"\\u03a3","hidden":"needle"}', 'Σ'),
    record(2, 'needle needle', 'needle'), record(3, 'unrelated')];
  assert.deepEqual(matchingRecords(records, query('needle')), [
    { ref: records[1].ref, application: true, message: false },
    { ref: records[2].ref, application: true, message: true },
  ]);
  assert.deepEqual(matchingRecords(records, query('σ')), [{ ref: records[1].ref, application: false, message: true }]);
  assert.deepEqual(matchingRecords(records, query('')), []);
  assert.deepEqual(matchingRecords([record(0, '  [a].*?+^$(){}|\\-  ')], query(' [a].*?+^$(){}|\\- ')), [
    { ref: records[0].ref, application: true, message: false },
  ]);
});

// Literal offsets are hand-worked expectations from #36, not another matcher.
const fixtures: { name: string; text: string; needle: string; folded: number[][]; exact: number[][];
  foldedWords?: number[][]; exactWords?: number[][] }[] = [
  { name: 'Kelvin/simple folding', text: 'k K K', needle: 'K', folded: [[0, 1], [2, 3], [4, 5]], exact: [[2, 3]] },
  { name: 'sigma/final sigma', text: 'Σ σ ς', needle: 'σ', folded: [[0, 1], [2, 3], [4, 5]], exact: [[2, 3]] },
  { name: 'sharp-s is not SS', text: 'ß ẞ SS ss', needle: 'SS', folded: [[4, 6], [7, 9]], exact: [[4, 6]] },
  { name: 'sharp-s simple folding', text: 'ß ẞ SS', needle: 'ß', folded: [[0, 1], [2, 3]], exact: [[0, 1]] },
  { name: 'no accent normalization', text: 'é e\u0301 É', needle: 'é', folded: [[0, 1], [5, 6]], exact: [[0, 1]] },
  { name: 'no locale tailoring', text: 'İ ı I i', needle: 'i', folded: [[4, 5], [6, 7]], exact: [[6, 7]] },
  { name: 'astral offsets and folding', text: '😀𐐀 𐐨', needle: '𐐨', folded: [[2, 4], [5, 7]], exact: [[5, 7]] },
  { name: 'lone surrogates stay original', text: '😀\ud800A\udc00', needle: 'a', folded: [[3, 4]], exact: [] },
  { name: 'lone surrogate literal', text: '😀\ud800A\udc00', needle: '\ud800', folded: [[2, 3]], exact: [[2, 3]], foldedWords: [], exactWords: [] },
  { name: 'original U0345 neighbors', text: '\u0345A\u0345', needle: 'a', folded: [[1, 2]], exact: [] },
  { name: 'original U0345 after astral', text: '😀\u0345Σ\u0345', needle: 'σ', folded: [[3, 4]], exact: [] },
  { name: 'U0345 itself folds in query', text: '\u0345', needle: 'ι', folded: [[0, 1]], exact: [] },
  { name: 'supplementary letter before', text: '𐐀a', needle: 'a', folded: [[2, 3]], exact: [[2, 3]], foldedWords: [], exactWords: [] },
  { name: 'supplementary letter after', text: 'a𐐀', needle: 'a', folded: [[0, 1]], exact: [[0, 1]], foldedWords: [], exactWords: [] },
  { name: 'Unicode number before', text: 'Ⅳa', needle: 'a', folded: [[1, 2]], exact: [[1, 2]], foldedWords: [], exactWords: [] },
  { name: 'underscore after', text: 'a_', needle: 'a', folded: [[0, 1]], exact: [[0, 1]], foldedWords: [], exactWords: [] },
  { name: 'combining mark outside words', text: 'a\u0301', needle: 'a', folded: [[0, 1]], exact: [[0, 1]] },
  { name: 'other connector outside words', text: 'a\u203f', needle: 'a', folded: [[0, 1]], exact: [[0, 1]] },
  { name: 'whitespace untrimmed', text: ' a  a ', needle: ' a ', folded: [[0, 3], [3, 6]], exact: [[0, 3], [3, 6]] },
  { name: 'literal line break', text: 'a\na', needle: '\n', folded: [[1, 2]], exact: [[1, 2]], foldedWords: [], exactWords: [] },
];
for (const fixture of fixtures) for (const matchCase of [false, true]) for (const wholeWords of [false, true]) {
  test(`${fixture.name}; case=${matchCase}; words=${wholeWords}`, () => {
    const records = [record(0, fixture.text)];
    const mode = query(fixture.needle, matchCase, wholeWords);
    const expected = matchCase ? wholeWords ? fixture.exactWords ?? fixture.exact : fixture.exact
      : wholeWords ? fixture.foldedWords ?? fixture.folded : fixture.folded;
    assert.deepEqual(sourceRanges(records, mode, [{ ref: records[0].ref, source: 'application', start: 0, end: fixture.text.length }])
      .ranges.map(range => [range.start, range.end]), expected);
    assert.deepEqual(matchingRecords(records, mode), expected.length ? [{ ref: records[0].ref, application: true, message: false }] : []);
  });
}

test('dense decoration caps never change exact counts, provenance or late visible access', () => {
  const records = Array.from({ length: 1000 }, (_, index) => record(index, 'a '.repeat(100), 'a '.repeat(100)));
  const scopes = records.map(record => ({ ref: record.ref, source: 'application' as const, start: 0, end: 200 }));
  const { ranges, coverage } = sourceRanges(records, query('a'), scopes);
  assert.equal(ranges.length, 4096);
  assert.equal(coverage[39].complete, true);
  assert.equal(coverage[40].complete, false);
  assert.equal(coverage[999].complete, false);
  const matches = matchingRecords(records, query('a'));
  assert.equal(matches.length, 1000);
  assert.deepEqual(matches[999], { ref: records[999].ref, application: true, message: true });
  const lateScope = { ref: records[999].ref, source: 'message' as const, start: 190, end: 200 };
  assert.deepEqual(sourceRanges(records, query('a'), [lateScope]), {
    ranges: [190, 192, 194, 196, 198].map(start => ({ ref: records[999].ref, source: 'message', start, end: start + 1 })),
    coverage: [{ scope: lateScope, complete: true }],
  });
});

test('maximum accepted literal compiles in all modes; oversized literal never executes', () => {
  const text = '[a].*?+^$(){}|\\-'.repeat(1024).slice(0, 16384);
  const records = [record(0, ` ${text} `)];
  for (const matchCase of [false, true]) for (const wholeWords of [false, true]) {
    assert.equal(matchingRecords(records, query(text, matchCase, wholeWords)).length, 1);
    assert.throws(() => matchingRecords(records, query(text + 'a', matchCase, wholeWords)), RangeError);
  }
});

test('actual retained windows bound matching at 1000 records and 5 MiB without searching the transport timestamp', async () => {
  const { retainSnapshot, ORIGINAL_TEXT_BUDGET } = await import('../src/core/snapshot.ts');
  const { formatDefault } = await import('../src/core/records.ts');
  for (const lines of [999, 1000, 1001]) {
    const snapshot = retainSnapshot(Array.from({ length: lines }, (_, index) => `2026-10-26T00:00:00Z {"message":"\\u03a3","hidden":"record ${index}"}`).join('\n'));
    const records = snapshot.records.map((value, index) => record(index, value.applicationText, formatDefault(value).message));
    const matches = matchingRecords(records, query('σ'));
    assert.equal(matches.length, Math.min(1000, lines));
    assert.deepEqual(matches[0], { ref: records[0].ref, application: false, message: true });
    assert.equal(matches.at(-1)?.ref.occurrence, records.length - 1);
    assert.deepEqual(matchingRecords(records, query('00:00:00')), []);
  }
  for (const bytes of [ORIGINAL_TEXT_BUDGET - 1, ORIGINAL_TEXT_BUDGET, ORIGINAL_TEXT_BUDGET + 1]) {
    const snapshot = retainSnapshot('a'.repeat(bytes - 2) + ' a');
    assert.equal(snapshot.retainedBytes, bytes > ORIGINAL_TEXT_BUDGET ? 0 : bytes);
    const records = snapshot.records.map((value, index) => record(index, value.applicationText, formatDefault(value).message));
    assert.equal(matchingRecords(records, query('a')).length, bytes > ORIGINAL_TEXT_BUDGET ? 0 : 1);
    if (!records.length) continue;
    const scope = { ref: records[0].ref, source: 'application' as const, start: bytes - 1, end: bytes };
    assert.deepEqual(sourceRanges(records, query('a'), [scope]), {
      ranges: [scope], coverage: [{ scope, complete: true }],
    });
  }
});
