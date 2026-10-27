// Mount the real versioned production CommonJS renderer with SDK/OS stand-ins.
// DOM focus/selection observations here are not physical input/clipboard proof.
import React from 'react';
import ReactDOM from 'react-dom';
import * as Mobx from 'mobx';

const check = (condition, message) => { if (!condition) throw new Error(message); };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const turn = () => sleep(0);
const results = [], errors = [], callbacks = new Map();
window.addEventListener('error', event => errors.push(String(event.error || event.message)));
window.addEventListener('unhandledrejection', event => errors.push(String(event.reason)));
let text = 'start\nx\nend', reads = 0, pendingRead, copies = [];
let status = { name: 'app', restartCount: 0, containerID: 'run-0' };
let uid = 'uid';
let heldReply, failNext = false, requestCount = 0;
const holdNext = () => { let release; const promise = new Promise(resolve => { release = resolve; }); heldReply = { promise, release }; return heldReply; };
const ipc = {
  listen(name, callback) { callbacks.set(name, callback); return () => callbacks.delete(name); },
  async invoke(name, ...args) {
    if (name === 'viewer-visibility-request') { callbacks.get(args[1])?.({}, args[0]); return; }
    const gate = name === 'find-request' ? heldReply : undefined;
    if (name === 'find-request') { requestCount++; heldReply = undefined; if (failNext) { failNext = false; throw new Error('Controlled SDK failure'); } }
    const result = await (await fetch('/find-rpc', { method: 'POST', body: JSON.stringify({ channel: name, args }) })).json();
    if (gate) await gate.promise;
    if (result.error) throw new Error(result.error); return result.value;
  },
  broadcast() {},
};
class Ipc { static createInstance() { return ipc; } }
class ExtensionStore {
  static getInstanceOrCreate() { return new this(); }
  cwd() { return '/isolated-identity-store'; }
  loadExtension() {}
}
Object.assign(globalThis, { global: globalThis, React, ReactDOM, Mobx, LensExtensions: {
  Common: { Store: { ExtensionStore } }, Renderer: { Ipc, LensExtension: class {},
    Catalog: { getActiveCluster: () => ({ id: 'cluster', name: 'Identity test' }) },
    K8sApi: { podsApi: {
      async get() { return { metadata: { uid, labels: {} }, spec: { containers: [{ name: 'app' }, { name: 'sidecar' }] },
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
async function verifyAsync() {
  button('Find');
  await refresh('Error.\nerror.\nerrors.\nxError.');
  const mode = label => root.querySelector(`button[aria-label="${label}"]`);
  const count = expected => check(root.querySelector('.rl-find-count').textContent.endsWith(`of ${expected} matching records`), root.querySelector('.rl-find-count').textContent);
  await query('Error.'); count(3);
  mode('Match case').click(); await until(settled); count(2);
  mode('Whole words').click(); await until(settled); count(1);
  mode('Match case').click(); await until(settled); count(2);
  check(!root.querySelector('button[aria-label*="regular expression"]'), 'Regex control shipped');
  const before = requestCount; await query('x'.repeat(16385));
  check(input().value.length === 16385 && root.textContent.includes('16,384 UTF-16'), 'Oversized query truncated or unexplained');
  check(requestCount === before, 'Oversized query executed');
  button('Clear'); await turn();
  check(input().value === '' && document.activeElement === input() && mode('Whole words').getAttribute('aria-pressed') === 'true', 'Clear lost focus/mode');
  mode('Whole words').click();
  results.push('production worker: four literal flag combinations, punctuation, oversize preservation/no dispatch and Clear');

  let gate = holdNext(); edit('Error');
  await until(() => heldReply === undefined, 'Delayed SDK attempt never dispatched');
  check(root.querySelector('.rl-find-count').textContent === 'Matching pending', 'New input exposed old completed count');
  check([...root.querySelectorAll('.rl-findbar button')].filter(node => ['Next', 'Previous'].includes(node.textContent)).every(node => node.disabled), 'Pending navigation enabled');
  await sleep(120); check(root.querySelector('.rl-find-count').textContent === 'Searching…', 'Searching feedback missing');
  root.querySelector('button[aria-label="Close Find"]').click(); gate.release(); await until(settled);
  check(!root.querySelector('.rl-find-current') && !root.querySelector('.rl-detail'), 'Closed Find completion chose a result/inspector');
  button('Find'); count(4);
  results.push('immediate pending/disabled navigation; delayed Searching; close permits current counts without a reveal');

  button('Clear'); gate = holdNext(); edit('Error'); await until(() => heldReply === undefined);
  button('Clear'); gate.release(); await sleep(30);
  check(input().value === '' && !root.querySelector('.rl-find-current') && root.querySelector('.rl-find-count').textContent === 'Enter text to find', 'Late completion revived cleared input');
  gate = holdNext(); edit('Error'); await until(() => heldReply === undefined);
  await query('errors.'); count(1); gate.release(); await sleep(30); count(1);
  check(input().value === 'errors.', 'Old input resurrected');
  results.push('Clear and out-of-order SDK replies cannot revive old query/results');

  failNext = true; await query('fails once');
  check(root.textContent.includes('could not complete'), 'Execution failure hidden');
  const failedCount = requestCount;
  await refresh('fails once\nlatest fails once');
  check(requestCount === failedCount && root.textContent.includes('could not complete'), 'Refresh retried a latched failure');
  [...root.querySelectorAll('.rl-findbar button')].find(node => node.textContent === 'Retry').click(); await until(settled); count(2);
  check(!root.querySelector('.rl-find-current'), 'Retry replayed an old reveal');
  results.push('latched execution error; refresh never retries; Retry uses current data without selection');

  button('Clear'); gate = holdNext(); edit('fails once'); await until(() => heldReply === undefined);
  await sleep(1050); check(root.textContent.includes('Find timed out'), 'Whole-attempt timeout missing');
  gate.release(); await sleep(30); check(root.textContent.includes('Find timed out'), 'Late success erased timeout');
  await query('latest'); count(1);
  results.push('whole-attempt renderer timeout rejects late success; explicit edit recovers');

  // Browser composition events exercise the production handler transaction,
  // without claiming physical IME behavior.
  button('Clear'); const composedBefore = requestCount;
  input().dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
  edit('la'); edit('late'); await sleep(30); check(requestCount === composedBefore, 'Uncommitted composition executed');
  edit('latest'); input().dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'latest' }));
  await until(settled); count(1); check(requestCount === composedBefore + 1, 'Composition committed more than once');
  input().dispatchEvent(new Event('input', { bubbles: true })); await sleep(30); check(requestCount === composedBefore + 1, 'Duplicate composition input executed');
  results.push('composition stages no work; committed value evaluates once with duplicate input guarded');

  button('Clear'); gate = holdNext(); edit('latest'); await until(() => heldReply === undefined);
  button('Edit profiles'); gate.release(); await until(settled); button('Back to logs');
  check(!root.querySelector('.rl-find-current'), 'Profiles return replayed a reveal');
  button('Clear'); await refresh('start\nx\nend'); root.querySelector('button[aria-label="Close Find"]').click();
  check(root.querySelector('.rl-update-status').textContent === 'Paused', 'Find changed explicit Pause');
  results.push('Profiles dismissal cancels pending selection/reveal and Find preserves Pause');
}
globalThis.verifyIdentity = async () => {
  extension.onActivate();
  const params = Object.fromEntries(Object.entries({ namespace: 'ns', pod: 'pod', podUid: 'uid', clusterId: 'cluster' }).map(([key, value]) => [key, { get: () => value }]));
  ReactDOM.render(<Page params={params} />, root);
  try {
    await until(() => rows().length === 3, 'No initial rows'); button('Pause');
    await verifyAsync();
    const oldX = rows()[1]; oldX.querySelector('.rl-row').click();
    button('Find'); await query('x');
    const focusedRow = oldX.querySelector('.rl-row'); focusedRow.focus({ preventScroll: true });
    const range = document.createRange(); range.selectNodeContents(oldX.querySelector('.rl-message'));
    document.getSelection().removeAllRanges(); document.getSelection().addRange(range);
    await refresh('x\nend\nx');
    check(rows()[0].classList.contains('rl-selected'), 'Inspection moved to appended duplicate instead of retained x');
    check(rows()[0].classList.contains('rl-find-current'), 'Find disagrees with inspection occurrence');
    check(rows()[0] === oldX, 'Retained occurrence lost its DOM identity');
    check(document.activeElement === focusedRow, 'Retained row lost DOM focus');
    check(document.getSelection().toString() === 'x', 'Retained row lost browser text selection');
    results.push('duplicate overlap: inspection, Find and DOM identity agree');
    await refresh('x\nend\nx');
    check(rows()[0] === oldX && document.activeElement === focusedRow && document.getSelection().toString() === 'x', 'Identical snapshot lost observed identity/focus/selection');
    results.push('identical complete window retains actual DOM focus and selection');
    button('Copy application text'); button('Copy transport line');
    check(copies.length === 2 && copies.every(value => value === 'x'), 'Original copy payload changed');
    await refresh('different\nx');
    check(!root.querySelector('.rl-selected') && !root.querySelector('.rl-detail'), 'Zero overlap did not expire inspection');
    check(!root.querySelector('.rl-find-current') && input().value === 'x', 'Eviction substituted another Find result or cleared the query');
    check(root.textContent.includes('Current result left the recent log window.'), 'Missing expired-result feedback');
    await refresh('x\nend\nx');
    check(!root.querySelector('.rl-selected') && !root.querySelector('.rl-find-current'), 'Returning equal text revived expired references');
    results.push('eviction/zero overlap expire references permanently without selecting substitutes');
    await query('newly gained hit');
    check(!root.querySelector('.rl-find-current'), 'No-hit query selected a result');
    await refresh('newly gained hit\nx');
    check(!root.querySelector('.rl-find-current') && root.querySelector('.rl-find-count').textContent === '0 of 1 matching records', 'Maintenance selected a newly gained match');
    results.push('maintenance updates newly gained match counts without choosing a result');
    await query('x');

    const longWindow = ['start', 'x', 'end', ...Array.from({ length: 100 }, (_, i) => `line ${i}`)];
    await refresh(longWindow.join('\n'));
    const scroller = root.querySelector('.rl-records');
    const anchored = rows()[40];
    scroller.scrollTop += anchored.getBoundingClientRect().top - scroller.getBoundingClientRect().top + 7;
    await sleep(50);
    const offset = anchored.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    await refresh([...longWindow.slice(1), 'x'].join('\n'));
    check(rows()[39] === anchored, 'Viewport anchor DOM occurrence was replaced');
    check(Math.abs(anchored.getBoundingClientRect().top - scroller.getBoundingClientRect().top - offset) < 1, 'Viewport anchor pixel offset changed');
    check(root.querySelector('.rl-follow-status').textContent === 'Scrolled away', 'Refresh changed normal following');
    button('To bottom'); check(root.querySelector('.rl-follow-status').textContent === 'Following output', 'To bottom failed');
    check(root.querySelector('.rl-update-status').textContent === 'Paused', 'Following changed explicit Pause');
    results.push('mounted viewport keeps retained pixel anchor; To bottom preserves Pause');

    // Metadata continues while explicitly paused. Wait for the real production
    // observer, rather than resetting the session through an internal side door.
    status = undefined; await sleep(3100);
    check(input().value === 'x', 'Missing metadata spuriously reset query');
    status = { name: 'app', restartCount: 0, containerID: 'run-0' }; await sleep(3100);
    check(input().value === 'x', 'Unchanged metadata reset query');
    for (const count of [1, 2]) {
      status = { name: 'app', restartCount: count };
      await until(() => input().value === '' && rows().length === 0, 'Paused restart did not reset Find and records');
      check(root.querySelector('.rl-update-status').textContent === 'Paused', 'Restart overrode Pause');
      await refresh('2026-10-22T12:34:56.123456789Z   { "message": "x", "hidden": "\\u03b1" }  ');
      await query('x');
      status = { ...status, containerID: `run-${count}` }; await sleep(3100);
      check(input().value === 'x' && rows().length === 1, 'Count-then-ID reset twice');
    }
    results.push('repeated same-container paused restarts reset Find; missing metadata and later ID do not');
    rows()[0].querySelector('.rl-row').click();
    button('Copy application text'); button('Copy transport line');
    check(copies.at(-2) === '  { "message": "x", "hidden": "\\u03b1" }  ', 'Exact application copy changed');
    check(copies.at(-1) === text, 'Exact transport copy changed');
    results.push('copy adapter receives exact originals including spaces, escapes and timestamp precision');

    // Hold an external log read across an observed restart; both old success
    // and failure must be harmless to the replacement instance.
    for (const failure of [false, true]) {
      let resolve, reject;
      const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
      pendingRead = { promise }; const before = reads; button('Refresh');
      await until(() => reads > before, 'Deferred read not started');
      status = { name: 'app', restartCount: status.restartCount + 1 };
      await until(() => input().value === '' && rows().length === 0, 'Restart did not invalidate pending read');
      pendingRead = undefined;
      if (failure) reject(new Error('old instance failure')); else resolve('old instance success');
      await turn(); await turn();
      check(rows().length === 0 && !root.querySelector('[role="alert"]'), 'Old completion altered the newer instance');
      await refresh('new instance x'); await query('x');
    }
    results.push('mounted session rejects old-instance log successes and failures');
    const container = root.querySelector('select[aria-label="Container"]');
    container.value = 'sidecar'; container.dispatchEvent(new Event('change', { bubbles: true })); await turn();
    check(input().value === '', 'Container change retained query');
    check(root.querySelector('.rl-update-status').textContent !== 'Paused', 'Container change did not preserve existing automatic-mode contract');
    button('Pause'); await query('x');
    uid = 'replacement';
    await until(() => root.textContent.includes('original Pod is gone'), 'UID replacement did not terminate the old target');
    const retainedRows = rows(); const beforeGone = reads;
    check(root.textContent.includes('outdated') && root.querySelector('select[aria-label="Container"]').disabled, 'UID replacement adopted the new Pod');
    await sleep(100); check(reads === beforeGone && rows()[0] === retainedRows[0], 'Terminal target kept reading');
    results.push('container resets context; Pod UID replacement retains terminal/outdated old target');
    check(getComputedStyle(scroller).backgroundColor === 'rgb(0, 0, 0)', 'Black canvas changed');
    check(!root.querySelector('.rl-line-number'), 'Line counters introduced');
  } finally {
    ReactDOM.unmountComponentAtNode(root); await extension.onDeactivate(); await turn();
  }
  check(callbacks.size === 0, 'IPC listener leak'); check(errors.length === 0, errors.join('; '));
  return { checks: results, reads, errors };
};
