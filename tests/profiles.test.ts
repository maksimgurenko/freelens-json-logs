import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeProfile, builtinProfile, decodePath, defaultFormatting, deleteProfile, duplicateProfile, formattingProblems,
  profileProblems, saveProfile, settingsProblem, type Profile, type Formatting, type ProfileSettings } from '../src/core/profiles.ts';
import { formatRecord, parseTransportLine } from '../src/core/records.ts';
import { configurationData, configurationProblem, defaultConfiguration } from '../src/core/configuration.ts';
import { findMatches } from '../src/core/navigation.ts';
import { SnapshotSession } from '../src/core/session.ts';

const time = '2026-10-22T12:34:56.123456789Z';
const format = (text: string, rules: Partial<Formatting> = {}) => formatRecord(parseTransportLine(`${time} ${text}`), { ...defaultFormatting(), ...rules });
const profile = (id = 'one', name = 'Payments'): Profile => duplicateProfile(builtinProfile(), id, name);
const initial = (): ProfileSettings => ({ profiles: [], globalDefault: 'default' });

test('exact slash paths decode literal dots, slash, tilde, empty keys and array indexes, without recursion', () => {
  assert.deepEqual(decodePath('/a~1b/a~0b/~01/'), ['a/b', 'a~b', '~1', '']);
  const text = JSON.stringify({ 'a/b': { 'a~b': 'escaped' }, 'log.level': 'debug', log: { level: 'error' },
    items: [{ code: 'first' }, { code: 'second' }], nested: { message: 'never searched' }, '': 'empty key' });
  for (const [path, expected] of [['/a~1b/a~0b', 'escaped'], ['/items/0/code', 'first'], ['/items/1/code', 'second'], ['/', 'empty key']]) {
    assert.equal(format(text, { messagePaths: [path] }).message, expected);
  }
  assert.equal(format(text, { levelPaths: ['/log.level'] }).level, 'DEBUG');
  assert.equal(format(text, { levelPaths: ['/log/level'] }).level, 'ERROR');
  for (const path of ['/message', '/items/01/code', '/items/-1/code', '/items/length', '/items/*/code', '/**/message']) assert.equal(format(text, { messagePaths: [path] }).message, text);
  for (const path of ['message', '', '/a~', '/a~2']) assert.throws(() => decodePath(path), /Invalid field path/);
});

test('configured ordered candidates replace defaults; missing/unusable paths and empty lists use role fallbacks', () => {
  const text = '{"error":{"message":null},"msg":" ","message":"not appended","timestamp":"bad","level":null}';
  const result = format(text, { messagePaths: ['/error/message', '/msg'], timestampPaths: [], levelPaths: [] });
  assert.equal(result.message, text); assert.equal(result.timestamp, time); assert.equal(result.level, undefined);
  assert.equal(format('{"message":"unused","msg":"  Ready  "}', { messagePaths: ['/missing', '/msg'] }).message, '  Ready  ');
  assert.equal(format(text, { messagePaths: [] }).message, text);
  assert.equal(format('{"time":"2026-10-22T07:00:00-05:00"}', { timestampPaths: ['/timestamp'] }).timestamp, time);
});

test('ordered inline fields omit extracted leaves and hidden descendants while retaining all siblings and exact originals', () => {
  const text = ' { "error": {"message":"Failed", "code":"E1", "internal":{"token":"secret"}, "other":null}, "items":[{"code":"first","keep":2}], "msg":"alias", "x":4 } ';
  const record = parseTransportLine(`${time} ${text}`), before = structuredClone(record);
  const result = formatRecord(record, { ...defaultFormatting(), messagePaths: ['/error/message'],
    inlinePaths: ['/x', '/error', '/error/code', '/items/0', '/msg'], hiddenPaths: ['/error/internal', '/items/0/code'] });
  assert.deepEqual(JSON.parse(JSON.stringify(result.inlineFields)), [{ path: '/x', value: 4 }, { path: '/error', value: { code: 'E1', other: null } },
    { path: '/items/0', value: { keep: 2 } }, { path: '/msg', value: 'alias' }]);
  assert.deepEqual(record, before); assert.equal(record.applicationText, text); assert.equal(record.transportLine, `${time} ${text}`);
  assert.equal((record.parsed?.error as { internal: unknown }).internal !== undefined, true);
});

test('hiding parent objects never suppresses extracted message/time/level, and fallback text is never redacted', () => {
  const text = '{"event":{"message":"Ready","time":"2026-10-22T10:00:00Z","level":"info","secret":true}}';
  const result = format(text, { messagePaths: ['/event/message'], timestampPaths: ['/event/time'], levelPaths: ['/event/level'], hiddenPaths: ['/event'], inlinePaths: ['/event'] });
  assert.equal(result.message, 'Ready'); assert.equal(result.level, 'INFO'); assert.equal(result.timestamp, '2026-10-22T10:00:00Z');
  assert.deepEqual(result.inlineFields, []); assert.deepEqual(Object.keys(result.additionalFields!), []);
  assert.equal(format(text, { messagePaths: [], hiddenPaths: ['/event'] }).message, text);
});

test('arrays retain original indexes and siblings when extracted leaves are omitted from compact objects', () => {
  const result = format('{"items":[{"code":"First","other":1},{"code":"Second"}]}', { messagePaths: ['/items/0/code'], inlinePaths: ['/items'] });
  assert.deepEqual(JSON.parse(JSON.stringify(result.inlineFields?.[0].value)), [{ other: 1 }, { code: 'Second' }]);
  assert.equal(format('{"items":["First","Second"]}', { messagePaths: ['/items/0'], inlinePaths: ['/items/1'] }).inlineFields?.[0].value, 'Second');
});

test('numeric application time is explicit, finite and range checked; strings retain zone requirements', () => {
  assert.equal(format('{"timestamp":1000}').timestamp, time);
  assert.equal(format('{"timestamp":1000}', { numericTimestamp: 'seconds' }).timestamp, '1970-01-01T00:16:40.000Z');
  assert.equal(format('{"timestamp":1000}', { numericTimestamp: 'milliseconds' }).timestamp, '1970-01-01T00:00:01.000Z');
  for (const value of ['1000', '2026-10-22T12:00:00', 1e300]) assert.equal(format(JSON.stringify({ timestamp: value }), { numericTimestamp: 'seconds' }).timestamp, time);
  assert.equal(format('{"timestamp":1e300,"time":0}', { numericTimestamp: 'milliseconds' }).timestamp, '1970-01-01T00:00:00.000Z');
  // Values outside RFC 3339's four-digit year range must not select an
  // application time that the presentation boundary cannot display.
  for (const value of [253402300800, -62167219201]) assert.equal(format(JSON.stringify({ timestamp: value }), { numericTimestamp: 'seconds' }).timestamp, time);
});

test('numeric/textual severity sources remain distinct; explicit mappings precede built-in normalization', () => {
  const rules: Partial<Formatting> = { severityMappings: [{ source: 30, target: 'INFO' }, { source: 'NOTICE', target: 'WARN' }, { source: 'warning', target: 'DEBUG' }] };
  assert.equal(format('{"level":30}', rules).level, 'INFO');
  assert.equal(format('{"level":"30"}', rules).level, '30');
  assert.equal(format('{"level":"notice"}', rules).level, 'WARN');
  assert.equal(format('{"level":"WARNING"}', rules).level, 'DEBUG');
  assert.equal(format('{"level":"error"}', rules).level, 'ERROR');
  assert.equal(format('{"level":"30"}', { severityMappings: [{ source: '30', target: 'FATAL' }] }).level, 'FATAL');
});

test('draft validation identifies names, paths, units, targets and duplicate sources; absent fields are valid', () => {
  const p = profile();
  for (const name of ['', '  ', 'Default', ' default ']) assert(profileProblems({ ...p, name }, []).length);
  assert.match(profileProblems({ ...p, id: 'two', name: 'payments' }, [p]).join(), /unique/);
  assert.match(profileProblems(builtinProfile(), []).join(), /read-only/);
  assert.equal(profileProblems({ ...p, format: { ...p.format, messagePaths: ['/missing'] } }, []).length, 0);
  for (const change of [{ messagePaths: ['bad'] }, { numericTimestamp: 'minutes' }, { severityMappings: [{ source: 30, target: 'NOTICE' }] },
    { severityMappings: [{ source: '', target: 'INFO' }] }, { severityMappings: [{ source: NaN, target: 'INFO' }] },
    { severityMappings: [{ source: 'NOTICE', target: 'INFO' }, { source: 'notice', target: 'WARN' }] }]) {
    assert(formattingProblems({ ...p.format, ...change }).length, JSON.stringify(change));
  }
  assert.equal(formattingProblems({ ...p.format, severityMappings: [{ source: 30, target: 'INFO' }, { source: '30', target: 'WARN' }] }).length, 0);
});

test('Save is atomic for valid drafts; Cancel by discarding a draft never changes saved or independent copies', () => {
  const p = profile(), duplicate = duplicateProfile(p, 'two', 'Other');
  let settings = saveProfile(saveProfile(initial(), p), duplicate);
  const before = structuredClone(settings), cancelled = structuredClone(p);
  cancelled.name = 'Discarded'; cancelled.format.messagePaths.push('/cancelled');
  assert.deepEqual(settings, before);
  const invalid = structuredClone(p); invalid.format.messagePaths = ['invalid'];
  assert.throws(() => saveProfile(settings, invalid), /Invalid field path/); assert.deepEqual(settings, before);
  const valid = structuredClone(p); valid.format.messagePaths = ['/changed'];
  settings = saveProfile(settings, valid); valid.format.messagePaths.push('/after-save');
  assert.deepEqual(settings.profiles[0].format.messagePaths, ['/changed']);
  assert.deepEqual(settings.profiles[1], duplicate); assert.deepEqual(p.format.messagePaths, ['/message', '/msg']);
});

test('stable IDs preserve rename references/order; delete returns global and manual choices to Default/Auto', () => {
  const one = profile(), two = profile('two', 'Second');
  let settings = { ...saveProfile(saveProfile(initial(), one), two), globalDefault: one.id };
  settings = saveProfile(settings, { ...one, name: 'Renamed' });
  assert.deepEqual(settings.profiles.map(p => p.id), ['one', 'two']);
  assert.equal(activeProfile(settings).name, 'Renamed'); assert.equal(activeProfile(settings, one.id).name, 'Renamed');
  assert.equal(activeProfile(settings, 'default').name, 'Default');
  assert.equal(activeProfile(settings, two.id).name, 'Second');
  settings = deleteProfile(settings, one.id);
  assert.equal(settings.globalDefault, 'default'); assert.equal(activeProfile(settings, one.id).id, 'default');
  assert.equal(activeProfile({ ...settings, globalDefault: two.id }, one.id).id, two.id);
});

test('schema 1 migrates valid Inspection explicitly; saved profiles share schema 3 without transient state', () => {
  for (const inspection of ['side', 'inline', 'bottom']) {
    const source = { schemaVersion: 1, viewer: { inspection } }, before = structuredClone(source);
    const migrated = configurationData(source);
    assert.equal(configurationProblem(migrated), undefined); assert.equal(migrated.schemaVersion, 3);
    assert.deepEqual(migrated.viewer, source.viewer); assert.deepEqual(source, before);
  }
  for (const source of [{ schemaVersion: 1, viewer: { inspection: 'bad' } }, { schemaVersion: 99, extra: 'preserve' }]) {
    assert.deepEqual(configurationData(source), source); assert(configurationProblem(source));
  }
  const saved = { ...defaultConfiguration(), ...saveProfile(initial(), profile()), viewer: { inspection: 'bottom' } };
  assert.equal(configurationProblem(saved), undefined);
  assert.deepEqual(configurationData(JSON.parse(JSON.stringify(saved))), saved);
  assert.equal(settingsProblem({ profiles: [profile(), profile()], globalDefault: 'one' }), 'Saved profile identities must be unique.');
  for (const bad of [null, {}, { profiles: [null] }, { profiles: [], globalDefault: 'missing' }, { profiles: [{ ...profile(), format: {} }], globalDefault: 'one' }]) assert(settingsProblem(bad));
});

test('profile changes immediately update Find messages without changing exact records', () => {
  const records = [parseTransportLine('{"msg":"other","payload":"decoded\\nneedle"}')], before = structuredClone(records);
  assert.deepEqual(findMatches(records, records.map(record => formatRecord(record, defaultFormatting()).message), 'decoded\nneedle'), []);
  assert.deepEqual(findMatches(records, records.map(record => formatRecord(record, { ...defaultFormatting(), messagePaths: ['/payload'] }).message), 'decoded\nneedle'), [0]);
  assert.deepEqual(records, before);
});

test('manual choice is per identified target/container, does not fetch, and clears on close/new view', async () => {
  let requests = 0;
  const target = { clusterId: 'cluster', clusterName: 'Cluster', namespace: 'ns', podName: 'pod', podUid: 'uid' };
  const pod = { uid: 'uid', regular: ['one', 'two'], init: [], ephemeral: [] };
  const clock = { now: () => 0, schedule: () => () => {} };
  const port = { loadPod: async () => pod, readLogs: async () => { requests++; return '{"msg":"Ready"}'; } };
  const session = new SnapshotSession(target, port, () => {}, undefined, clock);
  await session.open(); session.pause(); const before = requests, original = session.state.snapshot;
  session.selectProfile('one'); assert.equal(session.state.manualProfile, 'one');
  session.selectProfile(); assert.equal(session.state.manualProfile, undefined); assert.equal(requests, before); assert.equal(session.state.snapshot, original);
  session.selectProfile('one'); await session.selectContainer('two'); assert.equal(session.state.manualProfile, undefined);
  session.selectProfile('one'); session.dispose(); assert.equal(session.state.manualProfile, undefined);
  const next = new SnapshotSession({ ...target, podUid: 'replacement' }, port, () => {}, undefined, clock);
  assert.equal(next.state.manualProfile, undefined); next.dispose();
});
