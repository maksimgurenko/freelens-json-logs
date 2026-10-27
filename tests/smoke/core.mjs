// Runs in a fresh --expose-gc process with HOME, XDG paths, cwd and TMPDIR isolated.
import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import Module, { createRequire } from 'node:module';
import { reaction } from 'mobx';
import { SnapshotSession } from '../../src/core/session.ts';
import { LogRequests } from '../../src/core/requests.ts';
import { observe } from '../../src/core/observe.ts';
import { ORIGINAL_TEXT_BUDGET, TAIL_LINES } from '../../src/core/snapshot.ts';
import { defaultConfiguration } from '../../src/core/configuration.ts';

assert.equal(typeof global.gc, 'function', 'Run through npm run test:smoke');
const MiB = 1024 * 1024;
const limits = { heapUsed: 12 * MiB, external: 8 * MiB, rss: 96 * MiB };
const settle = () => new Promise(resolve => setImmediate(resolve));
const root = process.cwd();
const settings = join(root, 'extension-store', 'freelens-readable-logs');
mkdirSync(settings, { recursive: true });
const settingsPath = join(settings, 'readable-logs.json');
writeFileSync(settingsPath, JSON.stringify(defaultConfiguration()));

function footprint(directory = root, prefix = '') {
  return readdirSync(directory).sort().flatMap(name => {
    const path = join(directory, name), relative = join(prefix, name);
    if (statSync(path).isDirectory()) return footprint(path, relative);
    const data = readFileSync(path);
    return [{ path: relative, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') }];
  });
}

// Use the production main bundle and configuration store with real MobX and fs.
// Only the host's public SDK/Electron boundary is replaced (as in check:package).
let store;
class ExtensionStore {
  static getInstanceOrCreate() { return store ??= new this(); }
  cwd() { return settings; }
  loadExtension() {
    this.fromStore(JSON.parse(readFileSync(settingsPath, 'utf8')));
    this.stopSync ??= reaction(() => this.toJSON(), data => writeFileSync(settingsPath, JSON.stringify(data)));
  }
}
const handlers = new Map(), listeners = new Map();
const ipc = {
  handle(name, callback) { handlers.set(name, callback); },
  listen(name, callback) {
    const callbacks = listeners.get(name) ?? new Set(); listeners.set(name, callbacks); callbacks.add(callback);
    return () => { callbacks.delete(callback); if (!callbacks.size) listeners.delete(name); };
  },
  broadcast() {},
};
const app = Object.assign(new EventEmitter(), { quit() {} });
const window = Object.assign(new EventEmitter(), {
  isDestroyed: () => false, isVisible: () => true, isMinimized: () => false,
  webContents: Object.assign(new EventEmitter(), { getURL: () => 'https://renderer.freelens.app/cluster/cluster' }),
});
class Ipc { static createInstance() { return ipc; } }
global.LensExtensions = { Common: { Store: { ExtensionStore } }, Main: { LensExtension: class {}, Ipc } };
global.Mobx = await import('mobx');
const require = createRequire(import.meta.url);
// The bundle's only native dependency is Electron, supplied by the host at runtime.
const originalLoad = Module._load;
Module._load = function(name, ...args) {
  return name === 'electron' ? { app, BrowserWindow: { fromWebContents: () => window } } : originalLoad.call(this, name, ...args);
};
let Main;
try { Main = require(process.argv[2]).default; }
finally { Module._load = originalLoad; }
const extension = new Main();

class Clock {
  jobs = new Set();
  now() { return 0; }
  schedule(_delay, callback) { this.jobs.add(callback); return () => this.jobs.delete(callback); }
}
const clock = new Clock(), pool = new LogRequests();
const target = { clusterId: 'cluster', clusterName: 'Smoke', namespace: 'smoke', podName: 'pod', podUid: 'uid' };
const pod = { uid: 'uid', regular: ['app', 'sidecar'], init: [], ephemeral: [], instances: { app: { restarts: 0 } } };
let reads = 0, watchers = 0, fail = false;
function response() {
  // New text per response defeats deduplication; exercise both 1000 lines and 5 MiB.
  const payload = randomBytes(3900).toString('base64');
  return Array.from({ length: 1100 }, (_, index) => `2026-10-25T00:00:00Z ${JSON.stringify({
    msg: `RESOURCE_SMOKE_LOG_${++reads}_${index}`, payload, nested: { index, level: 'info' },
  })}`).join('\n') + '\n';
}
const port = {
  loadPod: async () => pod,
  async readLogs() { if (fail) throw new Error('injected read failure'); return response(); },
  watchPod(_target, received, failed) {
    watchers++;
    const stop = observe(async () => pod, received, failed, clock);
    return () => { watchers--; stop(); };
  },
};
const create = (identity = target, adapter = port) => new SnapshotSession(identity, adapter, () => {}, pool, clock);
const live = create();
await live.open(); await settle();

async function cycle(index) {
  // One view stays alive throughout: catch refresh history retained by a live view.
  await live.refresh(); await live.refresh();
  assert.equal(live.state.phase, 'ready');
  assert(live.state.snapshot.retainedBytes <= ORIGINAL_TEXT_BUDGET);
  assert(live.state.snapshot.retainedBytes > ORIGINAL_TEXT_BUDGET * 0.95);
  assert(live.state.snapshot.records.length <= TAIL_LINES);
  assert(live.state.snapshot.omittedLines > 0);
  live.pause(); await live.refresh(); await live.resume();
  live.setActive(false); await settle();
  assert.equal(clock.jobs.size, 0, 'Hidden view retained timers');
  assert.equal(watchers, 0, 'Hidden view retained metadata watcher');
  live.setActive(true); await settle();

  const identity = { ...target, podName: `churn-${index}` };
  const view = create(identity);
  await view.open(); await view.selectContainer('sidecar');
  fail = true; await view.refresh(); fail = false;
  assert.equal(view.state.phase, 'error'); await view.retry();
  view.dispose(); await settle();
  assert.equal(view.state.snapshot, undefined);
  assert.equal(watchers, 1, 'Disposed view retained metadata watcher');
  assert.equal(clock.jobs.size, 2, 'Disposed view retained timers');

  // Reads cannot be canceled by the SDK. Settlement after close must release
  // the shared guard on BOTH success and failure, across distinct target keys.
  for (const reject of [false, true]) {
    let complete;
    const lateTarget = { ...identity, podName: `${identity.podName}-${reject}` };
    const pending = create(lateTarget, { ...port, readLogs: () => new Promise((yes, no) => { complete = reject ? no : yes; }) });
    const opened = pending.open(); await settle(); pending.dispose();
    complete(reject ? new Error('late failure') : 'late success'); await opened; await settle();
    const key = JSON.stringify([lateTarget.clusterId, lateTarget.namespace, lateTarget.podName, lateTarget.podUid, 'app']);
    assert.equal(pool.outstanding(key), undefined, 'Settled request retained in shared pool');
    assert.equal(pending.state.snapshot, undefined);
  }

  extension.onActivate();
  for (let n = 0; n < 8; n++) {
    const reply = `viewer-visibility-${index}-${n}`;
    handlers.get('viewer-visibility-request')({ sender: {} }, 'cluster', reply);
    if (n % 2) for (const callback of listeners.get('viewer-visibility-stop')) callback({}, reply);
  }
  await extension.onDeactivate();
  assert.equal(listeners.size, 0, 'Main retained IPC listeners');
  assert.equal(app.eventNames().length, 0, 'Main retained shutdown listeners');
  assert.equal(window.eventNames().length + window.webContents.eventNames().length, 0, 'Main retained window listeners');
}

async function measure() {
  await settle(); global.gc(); await settle(); global.gc();
  const { heapUsed, external, rss } = process.memoryUsage();
  return { heapUsed, external, rss };
}
try {
  // Warm parsers, code paths and the allocator before comparing retained memory.
  for (let index = 0; index < 4; index++) await cycle(index);
  const baselineDisk = footprint();
  const samples = [await measure()];
  for (let batch = 0; batch < 6; batch++) {
    for (let index = 0; index < 6; index++) await cycle(4 + batch * 6 + index);
    samples.push(await measure());
    assert.deepEqual(footprint(), baselineDisk, 'Viewing logs grew or changed files on disk');
    for (const [metric, budget] of Object.entries(limits)) {
      assert(samples.at(-1)[metric] - samples[0][metric] <= budget,
        `${metric} grew by ${samples.at(-1)[metric] - samples[0][metric]} bytes after warmup (limit ${budget})`);
    }
  }
  // Preference changes should overwrite one small file, never create history,
  // log payloads, unsolicited backups or leftover atomic-write files.
  for (let index = 0; index < 100; index++) store.setInspection(index % 2 ? 'side' : 'bottom');
  const disk = footprint();
  assert.equal(disk.length, 1, `Unexpected retained files: ${JSON.stringify(disk)}`);
  assert.equal(disk[0].path, join('extension-store', 'freelens-readable-logs', 'readable-logs.json'));
  assert(disk[0].bytes < 4096, 'Saved settings grew unexpectedly');
  assert.deepEqual(JSON.parse(readFileSync(settingsPath, 'utf8')), defaultConfiguration());
  console.log(JSON.stringify({ check: 'core/main RAM and disk', cycles: 40, samples, limits, disk }, null, 2));
} finally {
  live.dispose(); await extension.onDeactivate(); store.stopSync?.();
  await settle();
  assert.equal(clock.jobs.size, 0, 'Teardown retained timers');
  assert.equal(watchers, 0, 'Teardown retained metadata watchers');
}
