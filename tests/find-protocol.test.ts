import test from 'node:test';
import assert from 'node:assert/strict';
import { findRequestProblem, isFindReply, sameFindKey, type FindRequest } from '../src/core/find-protocol.ts';

export const request = (): FindRequest => ({ requestId: 1,
  key: { viewerEpoch: 1, targetEpoch: 1, instanceEpoch: 1, windowRevision: 1, messageRevision: 1, queryRevision: 1 },
  query: { text: 'a', matchCase: false, wholeWords: false },
  records: [{ ref: { context: 'current-context', occurrence: 3 }, application: 'a😀', message: 'a' }], work: 'match',
});

test('the wire boundary rejects malformed/oversized input before execution', () => {
  assert.equal(findRequestProblem(request()), undefined);
  assert.equal(findRequestProblem({ ...request(), query: { ...request().query, text: 'a'.repeat(16385) } }), 'too-long');
  const malformed: unknown[] = [null, [], {}, { ...request(), requestId: -1 }, { ...request(), key: { ...request().key, instanceEpoch: NaN } },
    { ...request(), query: { text: 'a', matchCase: false, wholeWords: false, regex: true } },
    { ...request(), records: [request().records[0], request().records[0]] },
    { ...request(), records: [{ ...request().records[0], application: 'a'.repeat(5 * 1024 * 1024 + 1) }] },
    { ...request(), records: [{ ...request().records[0], application: '猫'.repeat(2 * 1024 * 1024) }] },
    { ...request(), work: 'ranges' },
    { ...request(), rangeInterest: { id: 1, scopes: [] } },
  ];
  for (const value of malformed) assert.equal(findRequestProblem(value), 'invalid');
});

test('replies must match every key dimension, request and worker generation; failures are equally guarded', () => {
  const input = request();
  const reply = { requestId: 1, key: input.key, workerGeneration: 2, kind: 'failed', reason: 'execution' };
  assert.equal(isFindReply(reply, input, 2), true);
  for (const dimension of Object.keys(input.key) as (keyof typeof input.key)[]) {
    const stale = { ...reply, key: { ...reply.key, [dimension]: 0 } };
    assert.equal(isFindReply(stale, input, 2), false, dimension);
    assert.equal(sameFindKey(stale.key, input.key), false);
  }
  assert.equal(isFindReply({ ...reply, requestId: 0 }, input, 2), false);
  assert.equal(isFindReply(reply, input, 3), false);
  assert.equal(isFindReply({ ...reply, reason: 'invalid-regex' }, input, 2), false);
  const matches = { ...reply, kind: 'matches', reason: undefined,
    records: [{ ref: input.records[0].ref, application: true, message: true }] };
  delete matches.reason;
  assert.equal(isFindReply(matches, input, 2), true);
  assert.equal(isFindReply({ ...matches, records: [matches.records[0], matches.records[0]] }, input, 2), false);
  assert.equal(isFindReply({ ...matches, records: [{ ...matches.records[0], ref: { context: 'foreign', occurrence: 3 } }] }, input, 2), false);
});

test('source ranges and coverage are tied to the current interest and original code-point boundaries', () => {
  const input = request();
  input.work = 'ranges'; input.rangeInterest = { id: 7, scopes: [{ ref: input.records[0].ref, source: 'application', start: 0, end: 3 }] };
  const reply = { requestId: 1, key: input.key, workerGeneration: 2, kind: 'ranges', interestId: 7,
    ranges: [{ ref: input.records[0].ref, source: 'application', start: 0, end: 1 }],
    coverage: [{ scope: input.rangeInterest.scopes[0], complete: true }] };
  assert.equal(findRequestProblem(input), undefined);
  assert.equal(isFindReply(reply, input, 2), true);
  assert.equal(isFindReply({ ...reply, interestId: 8 }, input, 2), false);
  for (const bounds of [[-1, 1], [0, 4], [1, 2], [2, 3], [1, 1]]) {
    assert.equal(isFindReply({ ...reply, ranges: [{ ...reply.ranges[0], start: bounds[0], end: bounds[1] }] }, input, 2), false);
    assert.equal(findRequestProblem({ ...input, rangeInterest: { id: 7, scopes: [{ ...reply.ranges[0], start: bounds[0], end: bounds[1] }] } }), 'invalid');
  }
  assert.equal(isFindReply({ ...reply, coverage: [] }, input, 2), false);
  assert.equal(isFindReply({ ...reply, ranges: Array(4097).fill(reply.ranges[0]) }, input, 2), false);
  assert.equal(isFindReply({ ...reply, ranges: [reply.ranges[0], reply.ranges[0]] }, input, 2), false);
  assert.equal(isFindReply({ ...reply, ranges: [{ ...reply.ranges[0], source: 'message' }] }, input, 2), false);
  assert.equal(isFindReply({ ...reply, coverage: [{ scope: { ...reply.coverage[0].scope, end: 1 }, complete: true }] }, input, 2), false);
});
