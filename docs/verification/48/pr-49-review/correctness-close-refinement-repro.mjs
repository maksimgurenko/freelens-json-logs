import assert from 'node:assert/strict';
import { FindPosition } from '../../../../src/core/find-state.ts';
import { matchingRecords } from '../../../../src/core/find-matcher.ts';
import { emptyWindow, replaceWindow, recordIndex } from '../../../../src/core/occurrences.ts';
import { parseTransportLine } from '../../../../src/core/records.ts';

// Run from the repository root:
// .scratch/readable-logs/toolchain/node_modules/node/bin/node --experimental-strip-types .ralph/pr49-review/correctness-close-refinement-repro.mjs
const window = replaceWindow(emptyWindow('independent-review'), Array.from({ length: 100 }, (_, i) =>
  parseTransportLine(i === 64 ? 'up' : i === 20 || i === 70 ? 'upstream' : 'other')));
const records = window.records.map((record, i) => ({ ref: window.refs[i], application: record.applicationText }));
const key = revision => ({ viewerEpoch: 1, targetEpoch: 1, instanceEpoch: 1,
  windowRevision: 1, messageRevision: 1, queryRevision: revision });
const evaluate = (find, text, revision, edit) => {
  find.prepare(window, key(revision), edit);
  find.accept(key(revision), matchingRecords(records,
    { text, matchCase: false, wholeWords: false }).map(match => match.ref));
};
const find = new FindPosition();
find.read(window.refs[64]); // Ordinary row inspection chooses the reading row.
evaluate(find, 'up', 1, 'new');
assert.equal(recordIndex(window, find.active), 64);
find.closeInspection(window.refs[64]);
assert.equal(find.reading, undefined);
assert.equal(recordIndex(window, find.active), 64);
assert.equal(recordIndex(window, find.candidate), 64);
assert.equal(find.position, undefined); // The successful Find position was lost.
evaluate(find, 'ups', 2, 'refine');
const actual = recordIndex(window, find.active);
assert.equal(actual, 20); // Demonstrate the pinned-head behavior.
console.log(JSON.stringify({ trigger: 'Close inspector after Find succeeds at the reading row; refine up to ups',
  expectedActiveRow: 70, actualActiveRow: actual, demonstrated: true }, null, 2));
