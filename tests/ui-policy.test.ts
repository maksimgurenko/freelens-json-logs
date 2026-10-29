import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// Verification helpers are JavaScript and do not enter the production bundle.
// @ts-expect-error Local .mjs helper intentionally has no declaration file.
import { requireAttended } from '../scripts/ui-test-policy.mjs';

test('native UI gate defers without opt-in before reading the desktop', () => {
  const previous = process.env.FREELENS_UI_MODE;
  try {
    delete process.env.FREELENS_UI_MODE;
    assert.throws(() => requireAttended(() => { throw Error('Desktop read before gate'); }), /DEFERRED/);
  } finally {
    if (previous === undefined) delete process.env.FREELENS_UI_MODE;
    else process.env.FREELENS_UI_MODE = previous;
  }
});

test('attended UI gate requires existing focus on Freelens workspace 7', () => {
  const previous = process.env.FREELENS_UI_MODE;
  try {
    process.env.FREELENS_UI_MODE = 'attended';
    for (const [workspace, window] of [[1, 'freelens'], [7, 'browser']] as const) {
      assert.throws(() => requireAttended((command: string) => command === 'activeworkspace'
        ? { id: workspace } : { class: window }), /DEFERRED/);
    }
    assert.doesNotThrow(() => requireAttended((command: string) => command === 'activeworkspace'
      ? { id: 7 } : { class: 'freelens' }));
  } finally {
    if (previous === undefined) delete process.env.FREELENS_UI_MODE;
    else process.env.FREELENS_UI_MODE = previous;
  }
});

test('native window probes defer before the CLI connects to the host', async () => {
  const previous = process.env.FREELENS_UI_MODE;
  const previousFetch = globalThis.fetch;
  const previousArgs = process.argv;
  const directory = mkdtempSync(join(tmpdir(), 'readable-logs-native-gate-'));
  const probe = join(directory, 'native-window.js');
  writeFileSync(probe, '// @ui-attended\ntrue;\n');
  try {
    delete process.env.FREELENS_UI_MODE;
    globalThis.fetch = () => { throw Error('Network before native probe gate'); };
    process.argv = ['node', 'host-cdp.mjs', '770814', probe];
    await assert.rejects(import(new URL('../scripts/host-cdp.mjs?native-probe-test', import.meta.url).href), /DEFERRED/);
  } finally {
    process.argv = previousArgs;
    rmSync(directory, { recursive: true, force: true });
    globalThis.fetch = previousFetch;
    if (previous === undefined) delete process.env.FREELENS_UI_MODE;
    else process.env.FREELENS_UI_MODE = previous;
  }
});
