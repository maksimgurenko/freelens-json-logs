// Source-level replay of the production Viewer memo dependencies and controllers.
// Run with the pinned Node --experimental-strip-types. No DOM or host is used.
import assert from 'node:assert/strict';
import { defaultConfiguration } from '../../../../src/core/configuration.ts';
import { activeProfile } from '../../../../src/core/profiles.ts';
import { parseTransportLine, recordFormatter } from '../../../../src/core/records.ts';
import { emptyWindow, replaceWindow } from '../../../../src/core/occurrences.ts';
import { FindPosition } from '../../../../src/core/find-state.ts';
import { FindClient, FindMatching } from '../../../../src/renderer/find-client.ts';
import { matchingRecords } from '../../../../src/core/find-matcher.ts';
import type { FindRequest } from '../../../../src/core/find-protocol.ts';

const retained = replaceWindow(emptyWindow('layout-repro'), Array.from({ length: 100 }, (_, i) =>
  parseTransportLine([2, 73, 82].includes(i) ? `row ${i} upstream` : `row ${i}`)));
const config = defaultConfiguration();
const profileContext = { namespace: 'test', container: 'app', labels: {} };
const initialProfile = activeProfile(config, undefined, profileContext);
const beforeMessages = retained.records.map(recordFormatter(initialProfile.format)).map(record => record.message);
// ConfigurationStore.setInspection(), src/adapter/configuration-store.ts:58.
const afterConfig = { ...config, viewer: { ...config.viewer, inspection: 'bottom' as const } };
// A changed preference.configuration reruns Viewer's profile useMemo at line 161.
const afterProfile = activeProfile(afterConfig, undefined, profileContext);
assert.notEqual(afterProfile.format, initialProfile.format);
const afterMessages = retained.records.map(recordFormatter(afterProfile.format)).map(record => record.message);
assert.deepEqual(afterMessages, beforeMessages);
assert.notEqual(afterMessages, beforeMessages);

const requests: { request: FindRequest; resolve: (value: unknown) => void }[] = [];
const client = new FindClient({ async invoke(channel, ...args) {
  if (channel === 'find-open') return 'owner';
  if (channel === 'find-request') return new Promise(resolve => {
    requests.push({ request: args[1] as FindRequest, resolve });
  });
} }, 'viewer');
const position = new FindPosition();
const matching = new FindMatching(client, state => {
  if (state.phase === 'ready') position.accept(state.key!, state.records.map(record => record.ref));
});
const key = { viewerEpoch: 1, targetEpoch: 1, instanceEpoch: 1, windowRevision: 1, messageRevision: 1, queryRevision: 1 };
const inputs = (messageRevision: number, messages: string[]) => ({
  key: { ...key, messageRevision }, query: { text: 'upstream', matchCase: false, wholeWords: false },
  records: retained.records.map((record, i) => ({ ref: retained.refs[i], application: record.applicationText, message: messages[i] })),
});
const tick = () => new Promise(resolve => setImmediate(resolve));
position.read(retained.refs[64]);
const first = inputs(1, beforeMessages);
position.prepare(retained, first.key, 'new');
matching.update(first, 'edit');
await tick();
assert.equal(requests.length, 1);
// The layout-only identity change increments messageRevision (Viewer:170).
const second = inputs(2, afterMessages);
position.prepare(retained, second.key, 'maintenance');
matching.update(second, 'maintenance');
await tick();
assert.equal(requests.length, 2);
const latest = requests[1];
latest.resolve({ requestId: latest.request.requestId, key: latest.request.key, workerGeneration: 0,
  kind: 'matches', records: matchingRecords(latest.request.records, latest.request.query) });
await tick();
assert.equal(matching.state.phase, 'ready');
assert.equal(matching.state.records.length, 3);
assert.equal(position.active, undefined);
assert.equal(position.takeReveal(retained, second.key), undefined);
await matching.dispose();
console.log(JSON.stringify({ equalMessageText: true, layoutOnlyMatchingRequests: requests.length,
  expectedPendingQueryResult: 73, actualActiveResult: position.active ?? null,
  scope: 'source-level dependency/controller replay; no mounted UI or host execution' }, null, 2));
