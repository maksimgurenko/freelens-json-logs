import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeProfile, builtinProfile, defaultMatching, deleteProfile, duplicateProfile, matchingProblems, moveProfile,
  profileMatches, saveProfile, type MatchConditions, type ProfileContext, type ProfileSettings } from '../src/core/profiles.ts';
import { configurationData, configurationProblem } from '../src/core/configuration.ts';
import { SnapshotSession } from '../src/core/session.ts';
import { recordFormatter } from '../src/core/records.ts';
import type { PodDescription } from '../src/core/target.ts';

const context = { namespace: 'prod', container: 'api', labels: { app: 'payments', tier: 'backend', empty: '' } };
const profile = (id: string, conditions: Partial<MatchConditions> = {}) => ({ ...duplicateProfile(builtinProfile(), id, id),
  matching: { enabled: true, conditions: { labels: [], ...conditions } } });
const settings = (...profiles: ReturnType<typeof profile>[]): ProfileSettings => ({ profiles, globalDefault: 'default' });

test('exact namespace/label/container conjunction; missing and differently cased keys or values fail', () => {
  const first = profile('first', { namespace: 'prod', container: 'api', labels: [{ key: 'app', value: 'payments' }, { key: 'tier', value: 'backend' }] });
  assert(profileMatches(first, context));
  const changes: Partial<ProfileContext>[] = [{ namespace: 'Prod' }, { container: 'API' }, { labels: {} }, { labels: { App: 'payments', tier: 'backend' } },
    { labels: { app: 'Payments', tier: 'backend' } }, { labels: { app: 'payments' } }];
  for (const change of changes) assert(!profileMatches(first, { ...context, ...change }));
  assert(profileMatches(profile('namespace', { namespace: 'prod' }), context));
  assert(profileMatches(profile('container', { container: 'api' }), context));
  assert(profileMatches(profile('labels', { labels: [{ key: 'empty', value: '' }] }), context));
  assert(!profileMatches(profile('missing', { labels: [{ key: 'missing', value: '' }] }), context));
  assert(!profileMatches(profile('inherited', { labels: [{ key: 'toString', value: 'anything' }] }), { ...context, labels: {} }));
});

test('strings are compared literally without wildcard/regex interpretation and unsupported conditions are rejected', () => {
  for (const namespace of ['*', 'pr.*', '/prod/', ' prod ']) assert(!profileMatches(profile('p', { namespace }), context));
  for (const unsupported of ['regex', 'wildcard', 'podName', 'cluster']) assert(matchingProblems({ enabled: true, conditions: { labels: [], [unsupported]: 'x' } }).length);
  for (const value of [null, {}, { enabled: 'yes', conditions: {} }, { enabled: true, conditions: null },
    { enabled: true, conditions: { namespace: '', labels: [] } }, { enabled: true, conditions: { labels: [{ key: '', value: 'x' }] } },
    { enabled: true, conditions: { labels: [{ key: 'a', value: 1 }] } },
    { enabled: true, conditions: { labels: [{ key: 'a', value: '1' }, { key: 'a', value: '2' }] } }]) assert(matchingProblems(value).length);
  assert.deepEqual(matchingProblems({ enabled: false, conditions: { labels: [{ key: 'a', value: '' }, { key: 'A', value: '2' }] } }), []);
});

test('manual precedes first enabled match, then global default; conditionless/disabled profiles never auto-match', () => {
  const empty = profile('empty'), disabled = profile('disabled', { namespace: 'prod' });
  disabled.matching.enabled = false;
  const first = profile('first', { namespace: 'prod' }), second = profile('second', { container: 'api' });
  const saved = { ...settings(empty, disabled, first, second), globalDefault: 'second' };
  assert.equal(activeProfile(saved, undefined, context).id, 'first');
  for (const id of ['empty', 'disabled', 'second', 'default']) assert.equal(activeProfile(saved, id, context).id, id);
  assert.equal(activeProfile(saved, 'deleted', context).id, 'first');
  assert.equal(activeProfile({ ...saved, globalDefault: 'disabled' }, undefined, { ...context, namespace: 'other', container: 'other' }).id, 'disabled');
  assert.equal(activeProfile(settings(empty), undefined, context).id, 'default');
  assert.equal(activeProfile({ ...settings(empty), globalDefault: 'missing' }, undefined, context).id, 'default');
});

test('saved ordering alone controls matching; stable-ID rename preserves order and manual/global references', () => {
  const first = profile('first', { namespace: 'prod' }), second = profile('second', { container: 'api' });
  const saved = { ...settings(first, second), globalDefault: first.id }, before = structuredClone(saved);
  const reordered = moveProfile(saved, second.id, -1);
  assert.equal(activeProfile(reordered, undefined, context).id, 'second'); assert.deepEqual(saved, before);
  assert.deepEqual(moveProfile(reordered, second.id, -1), reordered);
  assert.deepEqual(moveProfile(reordered, first.id, 1), reordered);
  assert.deepEqual(moveProfile(reordered, 'unknown', 1), reordered);
  const renamed = saveProfile(reordered, { ...first, name: 'Renamed' });
  assert.deepEqual(renamed.profiles.map(p => p.id), ['second', 'first']); assert.equal(renamed.globalDefault, first.id);
  assert.equal(activeProfile(renamed, first.id, context).name, 'Renamed');
  assert.equal(activeProfile(renamed, undefined, context).id, 'second');
});

test('deleting manual/default/matching profiles returns to ordinary Auto precedence', () => {
  const saved = { ...settings(profile('first', { namespace: 'prod' }), profile('second', { container: 'api' }), profile('fallback')), globalDefault: 'fallback' };
  const deleted = deleteProfile(saved, 'fallback');
  assert.equal(deleted.globalDefault, 'default'); assert.equal(activeProfile(deleted, 'fallback', context).id, 'first');
  assert.equal(activeProfile(deleteProfile(deleted, 'first'), undefined, context).id, 'second');
  assert.equal(activeProfile(deleteProfile(deleted, 'first'), undefined, { ...context, container: 'other' }).id, 'default');
});

test('duplicates own independent matching conditions and invalid matching never replaces saved data', () => {
  const first = profile('first', { labels: [{ key: 'app', value: 'payments' }] }), copy = duplicateProfile(first, 'copy', 'Copy');
  copy.matching.conditions.labels[0].value = 'other'; copy.matching.enabled = false;
  assert.equal(first.matching.conditions.labels[0].value, 'payments'); assert(first.matching.enabled);
  const saved = settings(first), before = structuredClone(saved);
  assert.throws(() => saveProfile(saved, { ...first, matching: { enabled: true, conditions: { labels: [{ key: '', value: '' }] } } }), /nonempty key/);
  assert.deepEqual(saved, before);
});

test('explicit schema 2 migration retains all profiles, identity, order, default and Inspection without modifying source', () => {
  const source = { schemaVersion: 2, viewer: { inspection: 'bottom' }, globalDefault: 'second',
    profiles: [profile('first'), profile('second')].map(({ matching: _old, ...p }) => p), __internal__: { migrations: { version: '0.1.15' } } };
  const before = structuredClone(source), migrated = configurationData(source);
  assert.equal(configurationProblem(migrated), undefined); assert.equal(migrated.schemaVersion, 3);
  assert.deepEqual(migrated.profiles, [profile('first'), profile('second')].map(p => ({ ...p, matching: defaultMatching() })));
  assert.equal(migrated.globalDefault, 'second'); assert.deepEqual(migrated.viewer, source.viewer); assert.deepEqual(source, before);
  const invalid = { ...source, profiles: [{ ...source.profiles[0], format: {} }] };
  assert.deepEqual(configurationData(invalid).profiles, invalid.profiles); assert(configurationProblem(configurationData(invalid)));
});

test('metadata label changes reevaluate paused retained records with no log IO, preserving originals and manual choice', async () => {
  let reads = 0;
  const pod: PodDescription = { uid: 'uid', labels: { app: 'payments' }, regular: ['api', 'worker'], init: [], ephemeral: [] };
  const target = { clusterId: 'cluster', clusterName: 'Cluster', namespace: 'prod', podName: 'pod', podUid: 'uid' };
  const session = new SnapshotSession(target, { loadPod: async () => pod, readLogs: async () => { reads++; return '{"message":"Default","other":"Matched"}'; } },
    () => {}, undefined, { now: () => 0, schedule: () => () => {} });
  const first = profile('first', { labels: [{ key: 'app', value: 'payments' }] }); first.format.messagePaths = ['/other'];
  const saved = settings(first), active = () => activeProfile(saved, session.state.manualProfile,
    { namespace: target.namespace, container: session.state.container, labels: session.state.podLabels ?? {} });
  await session.open(); session.pause(); const original = session.state.snapshot, before = structuredClone(original);
  assert.equal(recordFormatter(active().format)(original!.records[0]).message, 'Matched');
  session.observePod({ ...pod, labels: { app: 'other' } }); assert.equal(active().id, 'default');
  session.selectProfile('first'); session.observePod({ ...pod, labels: {} }); assert.equal(active().id, 'first');
  session.selectProfile(); assert.equal(active().id, 'default'); assert.equal(reads, 1); assert.deepEqual(original, before);
  session.selectProfile('first'); await session.selectContainer('worker'); assert.equal(session.state.manualProfile, undefined);
  session.selectProfile('first'); session.dispose(); assert.equal(session.state.manualProfile, undefined);
  for (const change of [{ clusterId: 'other' }, { podUid: 'replacement' }, { namespace: 'other' }, { podName: 'other' }]) {
    const next = new SnapshotSession({ ...target, ...change }, { loadPod: async () => pod, readLogs: async () => '' }, () => {});
    assert.equal(next.state.manualProfile, undefined); next.dispose();
  }
});
