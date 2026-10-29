// Loaded only in a disposable headless browser. Exercise the production bundle,
// React 17 DOM and MobX; replace only Freelens/Node APIs unavailable in Chromium.
import React from 'react';
import ReactDOM from 'react-dom';
import * as Mobx from 'mobx';

const check = (condition, message) => { if (!condition) throw new Error(message); };
const turn = () => new Promise(resolve => setTimeout(resolve, 0));
const errors = [];
window.addEventListener('error', event => errors.push(String(event.error || event.message)));
window.addEventListener('unhandledrejection', event => errors.push(String(event.reason)));
const callbacks = new Map(), subscriptions = new Set();
const rpcErrors = [];
let rpcSequence = 0;
// Observe ownership at native browser boundaries. DOM/heap samples additionally
// catch source indices or ranges retaining detached text after unmount.
const observers = new Set(), frames = new Set(), timers = new Set();
for (const name of ['ResizeObserver', 'MutationObserver']) {
  const Native = globalThis[name];
  globalThis[name] = class extends Native {
    observe(...args) { observers.add(this); return super.observe(...args); }
    disconnect() { observers.delete(this); return super.disconnect(); }
  };
}
const requestFrame = requestAnimationFrame.bind(globalThis), cancelFrame = cancelAnimationFrame.bind(globalThis);
globalThis.requestAnimationFrame = callback => {
  const id = requestFrame(time => { frames.delete(id); callback(time); }); frames.add(id); return id;
};
globalThis.cancelAnimationFrame = id => { frames.delete(id); cancelFrame(id); };
const timeout = setTimeout.bind(globalThis), interval = setInterval.bind(globalThis), clear = clearTimeout.bind(globalThis);
globalThis.setTimeout = (callback, ms, ...args) => {
  const id = timeout(() => { timers.delete(id); callback(...args); }, ms); timers.add(id); return id;
};
globalThis.setInterval = (callback, ms, ...args) => { const id = interval(callback, ms, ...args); timers.add(id); return id; };
globalThis.clearTimeout = globalThis.clearInterval = id => { timers.delete(id); clear(id); };
let writes = 0, reads = 0, serial = 0;
const ipc = {
  listen(name, callback) {
    const entries = callbacks.get(name) ?? new Set(); callbacks.set(name, entries); entries.add(callback);
    return () => { entries.delete(callback); if (!entries.size) callbacks.delete(name); };
  },
  async invoke(name, cluster, reply, ...rest) {
    if (name.startsWith('find-')) {
      const result = await (await fetch('/find-rpc', { method: 'POST', body: JSON.stringify({ sequence: ++rpcSequence, channel: name, args: [cluster, reply, ...rest] }) })).json();
      if (result.error) { rpcErrors.push(`${name}: ${result.error}`); throw new Error(result.error); } return result.value;
    }
    check(name === 'viewer-visibility-request', `Unexpected IPC invocation: ${name}`);
    subscriptions.add(reply);
    for (const callback of callbacks.get(reply) ?? []) callback({}, cluster);
  },
  broadcast(name, reply) { check(name === 'viewer-visibility-stop', `Unexpected IPC broadcast: ${name}`); subscriptions.delete(reply); },
};
class Ipc { static createInstance() { return ipc; } }
class ExtensionStore {
  static getInstanceOrCreate() { return new this(); }
  cwd() { return '/extension-store/freelens-readable-logs'; }
  loadExtension() {}
}
// Fail and count any attempted filesystem mutation, including swallowed errors.
const fs = new Proxy({ constants: {} }, { get(target, name) {
  if (name in target) return target[name];
  return () => {
    if (!['readFileSync', 'lstatSync'].includes(name)) writes++;
    throw Object.assign(new Error(`No browser filesystem: ${String(name)}`), { code: 'ENOENT' });
  };
} });
Object.assign(globalThis, { global: globalThis, React, ReactDOM, Mobx,
  LensExtensions: {
    Common: { Store: { ExtensionStore } },
    Renderer: {
      Component: { Icon: ({ material }) => <span className="Icon" aria-hidden="true">{material}</span> },
      Ipc, LensExtension: class {}, Catalog: { getActiveCluster: () => ({ id: 'cluster', name: 'Smoke' }) },
      K8sApi: { podsApi: {
        async get() { return { metadata: { uid: 'uid', labels: {} }, spec: { containers: [{ name: 'app' }, { name: 'sidecar' }] }, status: {} }; },
        async getLogs() {
          reads++;
          const payload = crypto.randomUUID().repeat(64);
          return Array.from({ length: 256 }, (_, index) => `2026-10-25T00:00:00Z ${JSON.stringify({
            msg: `RESOURCE_SMOKE_LOG_${reads}_${index}`, payload, nested: { level: 'info', index },
          })}`).join('\n') + '\n';
        },
      } },
    },
  },
});

// Supplied verbatim from out/renderer-<version>.js by the runner.
const module = { exports: {} };
const require = name => {
  if (name === 'node:fs') return fs;
  if (name === 'node:path') return { join: (...parts) => parts.join('/') };
  if (name === 'node:crypto') return { randomUUID: () => crypto.randomUUID() };
  if (name === 'electron') return { clipboard: { writeText() { throw new Error('Clipboard is outside this smoke test'); } } };
  throw new Error(`Unexpected native module: ${name}`);
};
new Function('module', 'exports', 'require', PACKED_RENDERER)(module, module.exports, require);
const extension = new module.exports.default();
const Page = extension.clusterPages[0].components.Page;
const root = document.querySelector('#root');
const button = label => {
  const found = [...root.querySelectorAll('button')].find(node => node.textContent.trim() === label || node.getAttribute('aria-label') === label);
  check(found && !found.disabled, `Missing enabled button: ${label}`); found.click();
};
async function until(predicate, message) {
  for (let index = 0; index < 400; index++) { if (predicate()) return; await turn(); }
  throw new Error(`${message}: ${root.querySelector('.rl-findbar')?.textContent}; SDK errors: ${rpcErrors.slice(-3).join('; ')}`);
}
async function refresh() {
  const before = reads; button('Refresh');
  await until(() => reads > before && !root.querySelector('.rl-records[aria-busy="true"]'), 'Refresh did not finish');
  await turn();
}
async function cycle() {
  extension.onActivate();
  const params = Object.fromEntries(Object.entries({ namespace: 'smoke', pod: `pod-${serial++}`, podUid: 'uid', clusterId: 'cluster' })
    .map(([key, value]) => [key, { get: () => value }]));
  ReactDOM.render(<Page params={params} />, root);
  await until(() => root.querySelectorAll('.rl-row').length === 256, 'Viewer failed to render logs');
  button('Pause'); await turn();
  for (let index = 0; index < 4; index++) {
    root.querySelector('.rl-row').click(); await turn();
    check(root.querySelector('[aria-label="Selected record"]'), 'Inspector did not open');
    await refresh();
  }
  button('Find'); await turn();
  const find = root.querySelector('input[aria-label="Find in logs"]');
  const edit = value => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(find, value);
    find.dispatchEvent(new Event('input', { bubbles: true }));
  };
  for (const value of ['R', 'RE', 'RESOURCE', 'absent', 'RESOURCE_SMOKE_LOG']) edit(value);
  const matched = () => root.querySelector('.rl-find-count')?.textContent.endsWith('of 256 matching records');
  await until(matched, 'Rapid query replacement lost complete matching');
  // Reformat retained windows without reads; then replace both query and source
  // windows while range requests follow the changing visible source spans.
  button('Edit profiles'); button('Duplicate');
  const paths = root.querySelector('textarea[aria-label="Message paths"]');
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(paths, '');
  paths.dispatchEvent(new Event('input', { bubbles: true })); button('Save profile');
  const profileId = root.querySelector('select[aria-label="Saved profile"]').value;
  button('Back to logs');
  const profile = root.querySelector('select[aria-label="Profile"]');
  const beforeProfiles = reads;
  for (let i = 0; i < 6; i++) { profile.value = i % 2 ? '' : profileId; profile.dispatchEvent(new Event('change', { bubbles: true })); }
  await until(matched, 'Profile churn lost current matching'); check(reads === beforeProfiles, 'Profile churn fetched logs');
  for (let i = 0; i < 3; i++) {
    const scroller = root.querySelector('.rl-records');
    scroller.scrollTop = i % 2 ? 0 : scroller.scrollHeight;
    scroller.dispatchEvent(new Event('scroll')); edit(i % 2 ? 'RESOURCE' : 'RESOURCE_SMOKE_LOG'); await refresh();
  }
  await until(matched, 'Window/interest replacement lost current matching');
  root.querySelector('[aria-label="Next match"]').click();
  root.querySelector('[aria-label="Search history"]').click(); await turn();
  check(root.querySelector('.rl-history-entry'), 'Explicit navigation did not commit history');
  root.querySelector('[aria-label="Close search history"]').click();
  // Delete the owned profile so the long-lived store cannot grow per cycle.
  button('Edit profiles');
  const savedProfile = root.querySelector('select[aria-label="Saved profile"]');
  savedProfile.value = profileId; savedProfile.dispatchEvent(new Event('change', { bubbles: true }));
  button('Delete'); button('Confirm delete'); button('Back to logs');
  button('Edit profiles'); await turn();
  const sample = root.querySelector('textarea[aria-label="Sample logs"]');
  check(sample, 'Profile editor did not open');
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(sample,
    JSON.stringify({ msg: `RESOURCE_SMOKE_SAMPLE_${serial}`, payload: 'preview'.repeat(10_000) }));
  sample.dispatchEvent(new Event('input', { bubbles: true })); await turn();
  check(root.querySelector('.rl-preview-record'), 'Sample preview did not render');
  button('Back to logs'); await turn();
  root.querySelector('[aria-label="Search history"]').click(); await turn();
  check(root.querySelector('.rl-history-popover'), 'Find history did not open');
  if (serial % 2) root.querySelector('[aria-label="Close search history"]').click();
  // Alternate normal route departure and extension disable while still mounted.
  if (serial % 2) extension.onDeactivate();
  ReactDOM.unmountComponentAtNode(root); await turn(); await turn();
  if (!(serial % 2)) extension.onDeactivate();
  check(!root.children.length, 'Unmount left viewer DOM');
  check(callbacks.size === 0 && subscriptions.size === 0, 'Unmount/disable retained IPC subscriptions');
  check(observers.size === 0 && frames.size === 0 && timers.size === 0, `Unmount retained observers/frames/timers: ${observers.size}/${frames.size}/${timers.size}`);
  check(CSS.highlights.size === 0, 'Unmount retained highlight ranges/registrations');
  check(writes === 0, 'Renderer attempted filesystem writes');
  check(errors.length === 0, `Renderer errors: ${errors.join('; ')}`);
  check(localStorage.length === 0 && sessionStorage.length === 0, 'Viewer persisted browser storage');
  check((await indexedDB.databases()).length === 0, 'Viewer retained an IndexedDB database');
  check((await caches.keys()).length === 0, 'Viewer retained a CacheStorage cache');
}
globalThis.resourceSmoke = {
  async batch(count) { for (let index = 0; index < count; index++) await cycle(); return { cycles: serial, reads, writes,
    observers: observers.size, frames: frames.size, timers: timers.size, highlights: CSS.highlights.size }; },
};
