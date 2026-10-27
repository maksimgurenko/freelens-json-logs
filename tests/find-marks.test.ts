import assert from 'node:assert/strict';
import test from 'node:test';
import { groupFindMarks, nextMarkMember } from '../src/core/find-marks.ts';

const refs = Array.from({ length: 5 }, (_, occurrence) => ({ context: 'marks', occurrence }));

test('seven-pixel slots retain every measured match in retained order, including coincident and end marks', () => {
  const groups = groupFindMarks(refs.map((ref, i) => ({ ref, top: [0, 2, 210, 211, 999][i] })), 1000, 35);
  assert.deepEqual(groups.map(group => ({ top: group.top, refs: group.members })), [
    { top: 0, refs: refs.slice(0, 2) }, { top: 7, refs: refs.slice(2, 4) }, { top: 28, refs: refs.slice(4) },
  ]);
  let previous;
  const visited = [];
  for (let i = 0; i < 5; i++) { previous = nextMarkMember(groups[0], previous); visited.push(previous); }
  assert.deepEqual(visited, [refs[0], refs[1], refs[0], refs[1], refs[0]]);
  assert.deepEqual(groupFindMarks([], 0, 0), []);
  assert.deepEqual(groupFindMarks([{ ref: refs[0], top: 0 }], 100, 6), []);
});
