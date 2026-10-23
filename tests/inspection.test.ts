import { test } from 'node:test';
import assert from 'node:assert/strict';
import { configurationData, configurationProblem, defaultConfiguration, isInspectionLayout } from '../src/core/configuration.ts';
import { initialInspection, originalText, selectRecord, selectedIndex } from '../src/core/inspection.ts';
import { formatDefault, parseTransportLine } from '../src/core/records.ts';

test('all layouts share selection while presentation, originals and complete fields stay independent', () => {
  const text = '  { "message": "α🙂 first\\nsecond", "msg": "unused", "log": {"level":"error","code":"E1"}, "private":true }  ';
  const record = parseTransportLine(`2026-10-22T12:34:56.123456789Z ${text}`);
  const records = [parseTransportLine('earlier'), record];
  const state = { ...initialInspection(), selected: selectRecord(records, 1) };
  const before = JSON.stringify(record);
  for (const layout of ['inline', 'side', 'bottom']) {
    assert(isInspectionLayout(layout));
    assert.equal(selectedIndex(records, state.selected), 1);
    const formatted = formatDefault(record);
    assert.equal(formatted.message, 'α🙂 first\nsecond');
    assert.equal(formatted.additionalFields?.msg, 'unused');
    assert.deepEqual(JSON.parse(JSON.stringify(formatted.additionalFields?.log)), { code: 'E1' });
    assert.equal(record.parsed?.private, true);
    assert.equal(originalText(record, 'application'), text);
    assert.equal(originalText(record, 'transport'), `2026-10-22T12:34:56.123456789Z ${text}`);
    assert.equal(JSON.stringify(record), before);
  }
});

test('exact copy payloads include empty/blank, indentation, Unicode, JSON escapes and precise timestamps', () => {
  for (const text of ['', '  ', '\t  at worker()  \r', 'α🙂 漢字', '{ "msg" : "line\\n\\t\\u03b1", "x" : 1 }']) {
    const line = `2026-10-22T12:34:56.123456789+00:00 ${text}`;
    const record = parseTransportLine(line);
    assert.equal(originalText(record, 'application'), text);
    assert.equal(originalText(record, 'transport'), line);
  }
  assert.equal(originalText(parseTransportLine(''), 'transport'), '');
});

test('snapshot replacement preserves a surviving exact record and never substitutes a different index', () => {
  const records = ['a', 'b', 'b', 'c'].map(parseTransportLine);
  const selected = selectRecord(records, 1);
  assert.equal(selectedIndex(['b', 'b', 'c', 'd'].map(parseTransportLine), selected), 0);
  assert.equal(selectedIndex(['b', 'c', 'd'].map(parseTransportLine), selected), -1);
  assert.equal(selectedIndex(['changed', 'else'].map(parseTransportLine), selected), -1);
  assert.equal(selectedIndex([], selected), -1);
  assert.equal(selectRecord(records, 7), undefined);
});

test('saved schema starts Side and separates profiles from temporary inspection state', () => {
  const saved = defaultConfiguration();
  assert.deepEqual(saved, { schemaVersion: 2, viewer: { inspection: 'side' }, profiles: [], globalDefault: 'default' });
  for (const inspection of ['inline', 'side', 'bottom']) assert.equal(configurationProblem({ ...saved, viewer: { inspection } }), undefined);
  assert.match(configurationProblem({ schemaVersion: 3 })!, /Unsupported configuration schema 3/);
  assert.match(configurationProblem({ ...saved, viewer: { inspection: 'unknown' } })!, /invalid/);
  assert.match(configurationProblem(null)!, /not an object/);
  const first = initialInspection();
  first.raw = true;
  first.content = 'transport';
  first.selected = selectRecord([parseTransportLine('first')], 0);
  assert.deepEqual(initialInspection(), { raw: false, content: 'fields' });
  assert.deepEqual(saved, defaultConfiguration());
});

test('host migration metadata alone is a first-use file, not an unsupported user schema', () => {
  const metadata = { migrations: { version: '0.1.8' } };
  assert.deepEqual(configurationData({ __internal__: metadata }), defaultConfiguration());
  assert.deepEqual(configurationData({ ...defaultConfiguration(), __internal__: metadata }), defaultConfiguration());
  const newer = configurationData({ schemaVersion: 3, unknown: 'preserve', __internal__: metadata });
  assert.equal(newer.unknown, 'preserve');
  assert.match(configurationProblem(newer)!, /Unsupported configuration schema 3/);
});
