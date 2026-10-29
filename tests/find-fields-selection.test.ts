import test from 'node:test';
import assert from 'node:assert/strict';
import { fieldsSelectionHasSource } from '../src/core/find-fields-selection.ts';

test('pretty fields seed only verified original lexemes, never generated indentation or decoded-only non-message values', () => {
  const application = '{"message":"x","other":"\\u03a3","value":"needle"}';
  const pretty = JSON.stringify(JSON.parse(application), null, 2);
  assert.equal(fieldsSelectionHasSource(application, pretty, pretty.indexOf('  '), pretty.indexOf('  ') + 2), false);
  assert.equal(fieldsSelectionHasSource(application, pretty, pretty.indexOf('Σ'), pretty.indexOf('Σ') + 1), false);
  assert.equal(fieldsSelectionHasSource(application, pretty, pretty.indexOf('needle'), pretty.indexOf('needle') + 6), true);
  const extracted = '{"message":"\\u03a3"}';
  const extractedPretty = JSON.stringify(JSON.parse(extracted), null, 2), offset = extractedPretty.indexOf('Σ');
  assert.equal(fieldsSelectionHasSource(extracted, extractedPretty, offset, offset + 1, 'Σ'), true);
  const mixed = '{"other":"\\u03a3 needle"}', mixedPretty = JSON.stringify(JSON.parse(mixed), null, 2), needle = mixedPretty.indexOf('needle');
  assert.equal(fieldsSelectionHasSource(mixed, mixedPretty, needle, needle + 6), true);
});

test('reordered keys, duplicate keys and numeric/string normalization cannot be guessed into original source offsets', () => {
  for (const application of ['{"2":"second","1":"first"}', '{"same":"old","same":"new"}', '{"value":1e3}', '{"value":"\\u0061"}']) {
    const pretty = JSON.stringify(JSON.parse(application), null, 2);
    const selection = application.includes('second') ? 'first' : application.includes('same') ? 'new' : application.includes('1e3') ? '1000' : 'a';
    const start = pretty.lastIndexOf(selection);
    assert.equal(fieldsSelectionHasSource(application, pretty, start, start + selection.length), false, application);
  }
});
