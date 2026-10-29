import { parentPort } from 'node:worker_threads';
import { FindRecordMatcher, sourceRanges } from '../core/find-matcher.ts';
import { findRequestProblem, type FindReply, type FindRequest } from '../core/find-protocol.ts';

declare const READABLE_LOGS_VERSION: string;
if (!parentPort) throw new Error('Find must run in its owned worker');
const port = parentPort;
const matcher = new FindRecordMatcher();

// The program is trusted build output. Query text and modes arrive only as data.
port.on('message', (value: unknown) => {
  if (typeof value !== 'object' || value === null || !('request' in value) || !('workerGeneration' in value) ||
    !Number.isSafeInteger(value.workerGeneration) || (value.workerGeneration as number) <= 0 || findRequestProblem(value.request)) {
    throw new TypeError('Rejected invalid Find worker input');
  }
  const request = value.request as FindRequest;
  const identity = { requestId: request.requestId, key: request.key, workerGeneration: value.workerGeneration as number };
  let reply: FindReply;
  try {
    reply = request.work === 'match'
      ? { ...identity, kind: 'matches', records: matcher.match(request.records, request.query) }
      : { ...identity, kind: 'ranges', interestId: request.rangeInterest!.id,
        ...sourceRanges(request.records, request.query, request.rangeInterest!.scopes) };
  } catch {
    reply = { ...identity, kind: 'failed', reason: 'execution' };
  }
  port.postMessage(reply);
});
port.postMessage({ kind: 'ready', version: READABLE_LOGS_VERSION });
