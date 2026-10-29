// Mount the real versioned production CommonJS renderer with SDK/OS stand-ins.
// DOM focus/selection observations here are not physical input/clipboard proof.
import React from 'react';
import ReactDOM from 'react-dom';
import * as Mobx from 'mobx';

const check = (condition, message) => { if (!condition) throw new Error(message); };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const turn = () => sleep(0);
const results = [], errors = [], callbacks = new Map();
// Observe browser resource ownership at the DOM boundary, across every mounted
// renderer owner. A disconnected observer/frame must not outlive unmount.
const geometryObservers = new Set(), geometryFrames = new Set();
for (const name of ['ResizeObserver', 'MutationObserver']) {
  const Native = globalThis[name];
  globalThis[name] = class extends Native {
    observe(...args) { geometryObservers.add(this); return super.observe(...args); }
    disconnect() { geometryObservers.delete(this); return super.disconnect(); }
  };
}
const requestFrame = globalThis.requestAnimationFrame.bind(globalThis), cancelFrame = globalThis.cancelAnimationFrame.bind(globalThis);
globalThis.requestAnimationFrame = callback => {
  const id = requestFrame(time => { geometryFrames.delete(id); callback(time); }); geometryFrames.add(id); return id;
};
globalThis.cancelAnimationFrame = id => { geometryFrames.delete(id); cancelFrame(id); };
window.addEventListener('error', event => errors.push(String(event.error || event.message)));
window.addEventListener('unhandledrejection', event => errors.push(String(event.reason)));
let text = 'start\nx\nend', reads = 0, podReads = 0, pendingRead, copies = [];
let status = { name: 'app', restartCount: 0, containerID: 'run-0' };
let uid = 'uid';
let heldReply, failNext = false, requestCount = 0;
let failNextRange = false;
let rpcSequence = 0;
const rangeRequests = [];
const holdNext = text => { let release; const promise = new Promise(resolve => { release = resolve; }); heldReply = { promise, release, text }; return heldReply; };
const ipc = {
  listen(name, callback) { callbacks.set(name, callback); return () => callbacks.delete(name); },
  async invoke(name, ...args) {
    if (name === 'viewer-visibility-request') { callbacks.get(args[1])?.({}, args[0]); return; }
    const exact = name === 'find-request' && args[1].work === 'match';
    const gate = exact && (!heldReply?.text || heldReply.text === args[1].query.text) ? heldReply : undefined;
    if (exact) { requestCount++; if (gate) heldReply = undefined; if (failNext) { failNext = false; throw new Error('Controlled SDK failure'); } }
    if (name === 'find-request' && !exact) {
      rangeRequests.push(args[1]);
      if (failNextRange) { failNextRange = false; throw new Error('Controlled decoration SDK failure'); }
    }
    const result = await (await fetch('/find-rpc', { method: 'POST', body: JSON.stringify({ sequence: ++rpcSequence, channel: name, args }) })).json();
    if (gate) await gate.promise;
    if (result.error) throw new Error(result.error); return result.value;
  },
  broadcast() {},
};
class Ipc { static createInstance() { return ipc; } }
const configurationStores = [];
class ExtensionStore {
  static getInstanceOrCreate() { const store=new this(); configurationStores.push(store); return store; }
  cwd() { return '/isolated-identity-store'; }
  loadExtension() {}
}
Object.assign(globalThis, { global: globalThis, React, ReactDOM, Mobx, LensExtensions: {
  Common: { Store: { ExtensionStore } }, Renderer: { Ipc, LensExtension: class {},
    Component: { Icon: ({ material }) => <span className="Icon material-icons" aria-hidden="true">{material}</span> },
    Catalog: { getActiveCluster: () => ({ id: 'cluster', name: 'Identity test' }) },
    K8sApi: { podsApi: {
      async get() { podReads++; return { metadata: { uid, labels: {} }, spec: { containers: [{ name: 'app' }, { name: 'sidecar' }] },
        status: { containerStatuses: status ? [status] : [] } }; },
      async getLogs() { reads++; if (pendingRead) return pendingRead.promise; return text; },
    } },
  },
} });
const module = { exports: {} };
const require = name => {
  if (name === 'node:fs') return { readFileSync() { throw Object.assign(new Error('Absent'), { code: 'ENOENT' }); } };
  if (name === 'node:path') return { join: (...parts) => parts.join('/') };
  if (name === 'node:crypto') return { randomUUID: () => crypto.randomUUID() };
  if (name === 'electron') return { clipboard: { writeText(value) { copies.push(value); } } };
  throw new Error(`Unexpected native module ${name}`);
};
new Function('module', 'exports', 'require', PACKED_RENDERER)(module, module.exports, require);
const extension = new module.exports.default();
const Page = extension.clusterPages[0].components.Page;
const root = document.querySelector('#root');
const rows = () => [...root.querySelectorAll('.rl-record')];
const button = label => {
  const node = [...root.querySelectorAll('button')].find(node => node.textContent.trim() === label);
  check(node && !node.disabled, `Missing enabled ${label}`); node.click();
};
const input = () => root.querySelector('#rl-find');
async function until(predicate, message) {
  for (let i = 0; i < 240; i++) { if (predicate()) return; await sleep(25); }
  throw new Error(message);
}
async function refresh(value) {
  text = value; const before = reads; button('Refresh');
  await until(() => reads > before && root.querySelector('.rl-records').getAttribute('aria-busy') === 'false', 'Refresh did not settle'); await until(() => !['Matching pending', 'Searching…'].includes(root.querySelector('.rl-find-count').textContent), 'Find maintenance did not settle'); await turn();
}
function edit(value) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input(), value);
  input().dispatchEvent(new Event('input', { bubbles: true }));
}
const settled = () => !['Matching pending', 'Searching…'].includes(root.querySelector('.rl-find-count').textContent);
async function query(value) { edit(value); await until(settled, 'Find did not settle'); await turn(); }
function selectText(node, start = 0, end = node.textContent.length) {
  const point = offset => {
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    for (let text; (text = walker.nextNode());) {
      if (offset <= text.length) return [text, offset]; offset -= text.length;
    }
    throw new Error('Selection outside source');
  };
  const range = document.createRange(); range.setStart(...point(start)); range.setEnd(...point(end));
  document.getSelection().removeAllRanges(); document.getSelection().addRange(range);
}

// Verification of review claims against the unchanged mounted production bundle.
// Browser event dispatch is isolated; no installed host, desktop input or clipboard.
const active = () => Number(root.querySelector('.rl-find-current')?.dataset.recordIndex ?? -1);
const snap = () => ({ active: active(), count: root.querySelector('.rl-find-count').textContent,
  selected: Number(root.querySelector('.rl-selected')?.dataset.recordIndex ?? -1), requests: requestCount,
  layout: root.querySelector('select[aria-label="Inspection"]').value });
function layout(value) {
  const select = root.querySelector('select[aria-label="Inspection"]');
  root.querySelector('.rl-display-options').open = true;
  select.value = value; select.dispatchEvent(new Event('change', { bubbles: true }));
}
function closeInspector() { root.querySelector('button[aria-label="Close record inspector"]').click(); }
async function selectReading(index) {
  if (root.querySelector('.rl-selected')) closeInspector();
  rows()[index].querySelector('.rl-row').click(); await turn();
  check(root.querySelector('.rl-selected')?.dataset.recordIndex === String(index), 'Reading setup failed');
}
function refine(value) {
  input().focus(); input().setSelectionRange(input().value.length, input().value.length);
  input().dispatchEvent(new InputEvent('beforeinput', { bubbles: true, inputType: 'insertText', data: value.at(-1) }));
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input(), value);
  input().dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value.at(-1) }));
}
globalThis.verifyIdentity = async () => {
  await document.fonts.ready; extension.onActivate();
  const params = Object.fromEntries(Object.entries({ namespace: 'ns', pod: 'pod', podUid: 'uid', clusterId: 'cluster' }).map(([key, value]) => [key, { get: () => value }]));
  ReactDOM.render(<Page params={params} />, root);
  try {
    await until(() => rows().length === 3, 'No initial rows'); button('Pause'); button('Find');
    await refresh(Array.from({ length: 100 }, (_, i) => i === 64 ? 'up' : [20,70].includes(i) ? 'upstream' : `row ${i}`).join('\n'));
    if (PR49_ONLY_CLAIM !== 'R3') for (const close of [false, true]) {
      if (input().value) button('Clear'); await selectReading(64); await query('up');
      check(active() === 64, 'Initial Find failed to address reading row');
      const initial = snap();
      if (close) closeInspector();
      const afterClose = snap(); refine('ups'); await until(settled, 'Refinement did not settle'); await turn();
      const final = snap();
      check(final.active === (PR49_EXPECT_FIXED ? 70 : close ? 20 : 70), 'R1 observation differs from pinned-head claim');
      results.push({ claim: 'R1', closeInspection: close, expectedActive: 70, initial, afterClose, final });
    }
    if (input().value) button('Clear'); await refresh(Array.from({ length: 100 }, (_, i) => [2,73,82].includes(i) ? `row ${i} upstream` : `row ${i}`).join('\n'));
    if (PR49_ONLY_CLAIM !== 'R1') for (const change of ['none', 'Raw', 'wrap', 'timestamps', 'inline', 'bottom', 'side', 'settings-echo']) {
      if (input().value) button('Clear');
      const initialLayout = change === 'side' ? 'bottom' : 'side';
      if (root.querySelector('select[aria-label="Inspection"]').value !== initialLayout) { layout(initialLayout); await turn(); }
      await selectReading(64);
      const before = snap(), sources = rows().map(row => row.querySelector('.rl-message').textContent);
      const gate = holdNext('upstream'); edit('upstream');
      await until(() => heldReply === undefined, 'Explicit match request not dispatched');
      const pending = snap();
      if (['inline','bottom','side'].includes(change)) layout(change);
      else if(change==='settings-echo') { const store=configurationStores[0]; store.fromStore(JSON.parse(JSON.stringify(store.data))); }
      else if (change === 'Raw') button('Raw');
      else if (change === 'wrap' || change === 'timestamps') {
        root.querySelector('.rl-display-options').open = true;
        const label = change === 'wrap' ? 'Word wrap' : 'Show timestamps';
        [...root.querySelectorAll('.rl-display-options input')].find(input => input.parentElement.textContent.includes(label)).click();
      }
      await turn(); gate.release(); await until(settled, `Pending ${change} case did not settle`); await turn();
      const final = snap();
      check(final.requests - before.requests === 1, `${change}: unexpected exact-match request count`);
      check(final.active === 73, `${change}: unexpected active result`);
      check(rows().every((row,i) => row.querySelector('.rl-message').textContent === sources[i]), 'Fixture changed source text');
      results.push({ claim: 'R3', presentationChange: change, expectedActive: 73, expectedExactRequests: 1,
        before, pending, final, equalDisplayedText: true });
      if (change === 'Raw') button('Readable');
    }
    if (PR49_ONLY_CLAIM !== 'R1') {
      if(input().value) button('Clear'); if(root.querySelector('.rl-selected')) closeInspector();
      await refresh('{"message":"\\u03a3","other":"other"}');
      await query('σ'); check(active()===0, 'Decoded extracted-message setup failed');
      const before=snap(), beforeReads=reads, store=configurationStores[0];
      store.saveProfile({id:'verify-content',name:'Verifier content',format:{messagePaths:['/other'],timestampPaths:[],levelPaths:[],inlinePaths:[],hiddenPaths:[],numericTimestamp:'unset',severityMappings:[]},matching:{enabled:false,conditions:{labels:[]}}});
      await turn(); check(requestCount===before.requests, 'Adding inactive profile changed matching');
      store.setGlobalDefault('verify-content'); await until(settled,'Changed message content did not settle'); await turn();
      const changed=snap();
      check(changed.requests===before.requests+1 && changed.active===-1 && changed.count==='0 of 0 matching records','Changed searchable content was masked by vector equality');
      store.setGlobalDefault('default'); await until(settled,'Restored content did not settle'); await turn();
      const restored=snap();
      check(restored.requests===changed.requests+1 && restored.active===-1 && restored.count==='0 of 1 matching records','Message maintenance chose a newly gained hit or failed to execute');
      check(reads===beforeReads,'Formatting content change fetched logs');
      results.push({claim:'R3',control:'changed searchable content still reevaluates in maintenance without choosing substitutes',before,changed,restored,additionalLogReads:reads-beforeReads});
    }
    check(errors.length === 0, errors.join('; '));
  } finally { ReactDOM.unmountComponentAtNode(root); await extension.onDeactivate(); await turn(); }
  check(callbacks.size === 0, 'IPC listeners remain');
  check(CSS.highlights.size === 0, 'Custom Highlight registrations remain');
  check(geometryObservers.size === 0 && geometryFrames.size === 0, 'Geometry observers or frames remain');
  return { checks: results, reads, errors };
};
