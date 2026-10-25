import assert from 'node:assert/strict';
import { test } from 'node:test';
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

test('ticket CDP transports refuse bringToFront before sending it to the host', async () => {
  const previousMode = process.env.FREELENS_UI_MODE;
  const previousNative = process.env.CV26_NATIVE;
  const previousPlaywright = process.env.CV26_PLAYWRIGHT;
  const previousFetch = globalThis.fetch, previousSocket = globalThis.WebSocket;
  const sent: string[] = [];
  class FakeSocket {
    listeners = new Map<string, ((event: unknown) => void)[]>();
    constructor() { queueMicrotask(() => this.emit('open', {})); }
    addEventListener(name: string, callback: (event: unknown) => void) {
      this.listeners.set(name, [...(this.listeners.get(name) ?? []), callback]);
    }
    emit(name: string, event: unknown) {
      for (const callback of this.listeners.get(name) ?? []) callback(event);
    }
    message(data: unknown) { this.emit('message', { data: JSON.stringify(data) }); }
    send(value: string) {
      const { id, method } = JSON.parse(value);
      sent.push(method);
      if (method === 'Runtime.enable') {
        for (const [id, origin] of [[1, 'http://localhost'], [2, 'http://770814.localhost']]) {
          this.message({ method: 'Runtime.executionContextCreated', params: {
            context: { id, origin, auxData: { isDefault: true } },
          } });
        }
      }
      this.message({ id, result: { result: { value: { x: 0, y: 0 } } } });
    }
    close() {}
  }
  try {
    delete process.env.FREELENS_UI_MODE;
    delete process.env.CV26_NATIVE;
    delete process.env.CV26_PLAYWRIGHT;
    globalThis.fetch = (async () => ({ json: async () => [{
      type: 'page', url: 'http://localhost', webSocketDebuggerUrl: 'ws://fake',
    }] })) as unknown as typeof fetch;
    globalThis.WebSocket = FakeSocket as unknown as typeof WebSocket;
    for (const ticket of ['26/continuation', '27', '28', '29', '30']) {
      const { connect } = await import(`../docs/verification/${ticket}/host.mjs`);
      const host = await connect();
      try {
        await assert.rejects(host.send('Page.bringToFront'), /DEFERRED/);
        assert(!sent.includes('Page.bringToFront'), `${ticket} requested foreground focus`);
      } finally { await host.close(); }
      process.env.CV26_NATIVE = '1';
      const count = sent.length;
      await assert.rejects(connect(), /DEFERRED/);
      assert.equal(sent.length, count, 'Native mode opened CDP before its gate');
      delete process.env.CV26_NATIVE;
    }
  } finally {
    globalThis.fetch = previousFetch;
    globalThis.WebSocket = previousSocket;
    for (const [key, value] of Object.entries({
      FREELENS_UI_MODE: previousMode, CV26_NATIVE: previousNative, CV26_PLAYWRIGHT: previousPlaywright,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('native window probes defer before the CLI connects to the host', async () => {
  const previous = process.env.FREELENS_UI_MODE;
  const previousFetch = globalThis.fetch;
  const previousArgs = process.argv;
  try {
    delete process.env.FREELENS_UI_MODE;
    globalThis.fetch = () => { throw Error('Network before native probe gate'); };
    process.argv = ['node', 'host-cdp.mjs', '770814', 'docs/verification/30/probes/native-unminimize.js'];
    await assert.rejects(import(new URL('../scripts/host-cdp.mjs?native-probe-test', import.meta.url).href), /DEFERRED/);
  } finally {
    process.argv = previousArgs;
    globalThis.fetch = previousFetch;
    if (previous === undefined) delete process.env.FREELENS_UI_MODE;
    else process.env.FREELENS_UI_MODE = previous;
  }
});
