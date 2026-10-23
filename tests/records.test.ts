import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTransportLine, formatDefault, displayTimestamp, timestampMillis } from '../src/core/records.ts';
const transportTime = '2026-10-21T12:00:00.123456789Z';
const read = (text: string) => formatDefault(parseTransportLine(`${transportTime} ${text}`));

test('authoritative Default examples: message candidates, whitespace and non-object fallbacks', () => {
  for (const [input, expected] of [
    ['{"message":null,"msg":"Started"}', 'Started'],
    ['{"message":"   ","msg":"  Started  "}', '  Started  '],
    ['{"message":"New","msg":"Old"}', 'New'],
    ['{"message":{"text":"Started"}}', '{"message":{"text":"Started"}}'],
    ['{"error":{"message":"Failed","code":"E1"}}', '{"error":{"message":"Failed","code":"E1"}}'],
    ['Starting worker', 'Starting worker'], ['{broken', '{broken'], ['[1,2]', '[1,2]'],
    ['"hello"', '"hello"'], ['42', '42'], ['null', 'null'], ['true', 'true'],
    ['    at worker()', '    at worker()'], ['  ', '  '], ['', ''],
    ['{"msg":"first\\nsecond"}', 'first\nsecond'],
  ]) assert.equal(read(input).message, expected, input);
});

test('exact original strings, timestamp precision, complete objects and unused aliases survive extraction', () => {
  const original = '{ "msg" : "Ready", "x" : 1, "message": null, "timestamp": "bad", "log": {"level":"error","code":"E1"} }';
  const line = `${transportTime} ${original}`;
  const record = parseTransportLine(line);
  const before = JSON.stringify(record);
  const result = formatDefault(record);
  assert.equal(record.transportLine, line);
  assert.equal(record.applicationText, original);
  assert.equal(record.kubernetesTimestamp, transportTime);
  assert.deepEqual(record.parsed, JSON.parse(original));
  assert.equal(result.level, 'ERROR');
  assert.deepEqual(JSON.parse(JSON.stringify(result.additionalFields)), { x: 1, message: null, timestamp: 'bad', log: { code: 'E1' } });
  assert.equal(JSON.stringify(record), before);
  assert.equal(read('{"message":"New","msg":"Old"}').additionalFields?.msg, 'Old');
});

test('time: ordered valid candidates, explicit timezone, no numeric inference, local display', () => {
  assert.equal(read('{"timestamp":"bad","time":"2026-10-21T07:00:00-05:00","@timestamp":"2026-10-21T10:00:00Z"}').timestamp, '2026-10-21T07:00:00-05:00');
  for (const value of ['2026-10-21T12:00:00', '1000', 1000, null, true, [], {}, '2026-02-30T12:00:00Z']) {
    const result = read(JSON.stringify({ timestamp: value }));
    assert.equal(result.timestamp, transportTime, JSON.stringify(value));
    assert.equal(result.timestampSource, 'kubernetes');
  }
  const result = read('{"time":"2026-10-21T10:42:11Z","level":"error","msg":"Payment declined","orderId":841}');
  assert.equal(result.timestampSource, 'application');
  assert.match(displayTimestamp(result.timestamp, 'America/Cancun'), /05:42:11/);
  assert.equal(result.additionalFields?.orderId, 841);
  assert.equal(formatDefault(parseTransportLine('plain')).timestamp, undefined);
  assert.equal(timestampMillis('2024-02-29T12:00:00.123456789Z'), Date.parse('2024-02-29T12:00:00.123Z'));
  assert.equal(timestampMillis('2026-10-21T07:00:00-05:00'), Date.parse('2026-10-21T12:00:00Z'));
  assert.equal(timestampMillis('2026-10-21t12:00:00z'), Date.parse('2026-10-21T12:00:00Z'));
  for (const value of ['2025-02-29T00:00:00Z', '2026-01-01T24:00:00Z', '2026-01-01T00:60:00Z', '2026-01-01T00:00:61Z', '2026-00-01T00:00:00Z', '2026-10-21T12:00:00+24:00', '2026-10-21T12:00:00+01:60']) assert.equal(timestampMillis(value), undefined, value);
});

test('level: canonical names, unknown/numeric precedence, exact literal and nested paths', () => {
  for (const name of ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']) assert.equal(read(JSON.stringify({ level: name.toLowerCase() })).level, name);
  assert.equal(read('{"level":null,"severity":"warning"}').level, 'WARN');
  assert.equal(read('{"level":"NOTICE","severity":"error"}').level, 'NOTICE');
  assert.equal(read('{"level":30,"severity":"error"}').level, '30');
  assert.equal(read('{"level":30}').canonicalLevel, undefined);
  assert.equal(read('{"level":{},"severity":[],"log.level":"debug","log":{"level":"error"}}').level, 'DEBUG');
  assert.equal(read('{"level":" ","severity":false,"log.level":null,"log":{"level":"fatal"}}').level, 'FATAL');
  assert.equal(read('{"other":{"level":"error"}}').level, undefined);
  assert.deepEqual(read('{"log.level":"debug","log":{"level":"error"}}').additionalFields?.log, { level: 'error' });
});

test('split only a validated timestamp and one separator; retain CR, spaces, tabs, Unicode and prototype keys', () => {
  const line = '2026-10-21T12:00:00.123456789+00:00  \tα🙂\r';
  assert.equal(parseTransportLine(line).applicationText, ' \tα🙂\r');
  for (const line of ['2026-02-30T12:00:00Z text', '2026-10-21T12:00:00 text', 'not-time text']) assert.equal(parseTransportLine(line).applicationText, line);
  const record = parseTransportLine('{"__proto__":{"message":"evil"},"msg":"safe"}');
  assert.equal(formatDefault(record).message, 'safe');
  assert.deepEqual(formatDefault(record).additionalFields?.__proto__, { message: 'evil' });
});
