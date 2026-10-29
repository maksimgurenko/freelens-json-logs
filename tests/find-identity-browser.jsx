// Mount the real versioned production CommonJS renderer with SDK/OS stand-ins.
// DOM focus/selection observations here are not physical input/clipboard proof.
import React from 'react';
import ReactDOM from 'react-dom';
import * as Mobx from 'mobx';
import { verifyFindPresentation } from './find-presentation-browser.jsx';
import { verifyFindMarks } from './find-marks-browser.jsx';
import { verifyFindIntegration } from './find-integration-browser.jsx';
import { verifyFindPerformance } from './find-performance-browser.jsx';

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
let heldRangeReply;
let failNextRange = false;
let rpcSequence = 0;
const rangeRequests = [];
const holdNext = text => { let release; const promise = new Promise(resolve => { release = resolve; }); heldReply = { promise, release, text }; return heldReply; };
const holdNextRange = () => { let release; const promise = new Promise(resolve => { release = resolve; }); heldRangeReply = { promise, release, dispatched: false }; return heldRangeReply; };
const ipc = {
  listen(name, callback) { callbacks.set(name, callback); return () => callbacks.delete(name); },
  async invoke(name, ...args) {
    if (name === 'viewer-visibility-request') { callbacks.get(args[1])?.({}, args[0]); return; }
    const exact = name === 'find-request' && args[1].work === 'match';
    const gate = exact && (!heldReply?.text || heldReply.text === args[1].query.text) ? heldReply : undefined;
    const rangeGate = name === 'find-request' && !exact ? heldRangeReply : undefined;
    if (rangeGate) { heldRangeReply = undefined; rangeGate.dispatched = true; }
    if (exact) { requestCount++; if (gate) heldReply = undefined; if (failNext) { failNext = false; throw new Error('Controlled SDK failure'); } }
    if (name === 'find-request' && !exact) {
      rangeRequests.push(args[1]);
      if (failNextRange) { failNextRange = false; throw new Error('Controlled decoration SDK failure'); }
    }
    const result = await (await fetch('/find-rpc', { method: 'POST', body: JSON.stringify({ sequence: ++rpcSequence, channel: name, args }) })).json();
    if (gate) await gate.promise;
    if (rangeGate) await rangeGate.promise;
    if (result.error) throw new Error(result.error); return result.value;
  },
  broadcast() {},
};
class Ipc { static createInstance() { return ipc; } }
const configurationStores = [];
class ExtensionStore {
  static getInstanceOrCreate() { const store = new this(); configurationStores.push(store); return store; }
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
  const node = [...root.querySelectorAll('button')].find(node => node.textContent.trim() === label || node.getAttribute('aria-label') === (label === 'Clear' ? 'Clear Find' : label));
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

async function verifyInspectionFindState() {
  const closeInspector = () => root.querySelector('[aria-label="Close record inspector"]')?.click();
  const active = () => Number(root.querySelector('.rl-find-current')?.dataset.recordIndex ?? -1);
  button('Find');
  const layout = root.querySelector('select[aria-label="Inspection"]'), originalLayout = layout.value;
  await refresh('{"message":"visible message","secret":"needle"}');
  for (const value of ['inline', 'bottom', 'side']) {
    layout.value = value; layout.dispatchEvent(new Event('change', { bubbles: true }));
    await query('needle');
    check(root.querySelector('.rl-find-ordinal').textContent.trim() === '1 / 1', 'Inspection click setup has no active result');
    rows()[0].querySelector('.rl-row').click();
    check(root.querySelector('.rl-detail') && active() === 0 && root.querySelector('.rl-find-ordinal').textContent.trim() === '1 / 1', `${value}: Inspecting the found row changed 1 / 1 to 0 / 1`);
    rows()[0].querySelector('.rl-row').click();
    check(!root.querySelector('.rl-detail') && active() === 0, `${value}: Deselecting inspection cleared the independent Find result`);
    button('Clear');
  }
  layout.value = originalLayout; layout.dispatchEvent(new Event('change', { bubbles: true }));
  results.push('inspecting and deselecting the active hidden-source result preserves 1 / 1 in Inline/Bottom/Side');
  await refresh(Array.from({ length: 100 }, (_, index) => index === 64 ? 'up' : [20, 70].includes(index) ? 'upstream' : `row ${index}`).join('\n'));
  for (const close of [false, true]) {
    if (input().value) button('Clear'); closeInspector(); rows()[64].querySelector('.rl-row').click();
    await query('up'); check(active() === 64, 'Inspection refinement setup did not address the reading row');
    if (close) closeInspector();
    check(active() === 64, 'Closing inspection lost the independent Find result');
    await query('ups'); check(active() === 70, 'Closing inspection made refinement jump backward');
  }
  results.push('inspector Close preserves the successful Find origin: row64 refines forward to70 rather than wrapping to20');

  button('Clear'); closeInspector();
  await refresh(Array.from({ length: 100 }, (_, index) => [2, 73, 82].includes(index) ? `row ${index} upstream` : `row ${index}`).join('\n'));
  const store = configurationStores[0], originalConfiguration = JSON.parse(JSON.stringify(store.toJSON()));
  const synchronizedProfile = 'synchronized-find-profile';
  for (const change of ['inline', 'bottom', 'side', 'settings synchronization']) {
    if (input().value) button('Clear'); closeInspector();
    if (change === 'settings synchronization') {
      store.saveProfile({ id: synchronizedProfile, name: 'Synchronized Find profile',
        format: { messagePaths: ['/message'], timestampPaths: [], levelPaths: [], inlinePaths: [], hiddenPaths: [], numericTimestamp: 'unset', severityMappings: [] },
        matching: { enabled: false, conditions: { labels: [] } } });
      store.setGlobalDefault(synchronizedProfile); await turn();
    }
    rows()[64].querySelector('.rl-row').click();
    const before = requestCount, beforeReads = reads, source = rows().map(row => row.querySelector('.rl-message').textContent);
    const gate = holdNext('upstream'); edit('upstream');
    await until(() => heldReply === undefined, 'Pending layout query did not dispatch');
    const control = root.querySelector('select[aria-label="Inspection"]');
    root.querySelector('.rl-display-options').open = true;
    if (change === 'settings synchronization') {
      // The SDK recreates nested objects when settings arrive from main. Equal
      // extracted text must keep the explicit query's selection permission.
      const format = store.toJSON().profiles.find(profile => profile.id === synchronizedProfile).format;
      store.fromStore(JSON.parse(JSON.stringify(store.toJSON())));
      check(store.toJSON().profiles.find(profile => profile.id === synchronizedProfile).format !== format, 'Settings synchronization did not recreate the saved formatting rules');
    } else { control.value = change; control.dispatchEvent(new Event('change', { bubbles: true })); }
    await turn();
    gate.release(); await until(settled, 'Pending layout query did not settle'); await turn();
    check(requestCount === before + 1, `${change}: Equal settings restarted exact matching`);
    check(active() === 73, `${change}: Equal settings cancelled pending query selection`);
    check(reads === beforeReads, `${change}: Presentation settings fetched logs`);
    check(rows().every((row, index) => row.querySelector('.rl-message').textContent === source[index]), 'Layout fixture changed source text');
    if (change !== 'settings synchronization') check(control.value === change, 'Inspection layout did not update');
    root.querySelector('.rl-display-options').open = false;
  }
  results.push('Inline/Bottom/Side layout changes and equal synchronized settings preserve a pending query, its exact request and row73 selection');
  button('Clear'); closeInspector(); root.querySelector('[aria-label="Close Find"]').click();
  store.fromStore(originalConfiguration); await turn();
  await refresh('start\nx\nend');
}
// Production renderer/CSS seam: the canvas stays black even in a light host.
async function verifyCanvasContrast() {
  const colors = ['--textColorAccent', '--textColorSecondary', '--tableBgcSelected', '--tableBgcStripe', '--mainBackground'];
  const previous = colors.map(name => [name, root.style.getPropertyValue(name)]);
  const luminance = color => {
    const rgb = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
      value /= 255; return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
    });
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  };
  const contrast = (foreground, background) => {
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    return (values[0] + .05) / (values[1] + .05);
  };
  try {
    for (const [theme, values] of [['light', ['#222', '#555', '#e4e4e4', '#eee', '#fff']],
      ['dark', ['#e3e5e8', '#a6adb5', '#263737', '#2a2d33', '#1e2124']]]) {
      colors.forEach((name, index) => root.style.setProperty(name, values[index]));
      const row = rows()[0].querySelector('.rl-row'), canvas = root.querySelector('.rl-records');
      check(getComputedStyle(canvas).backgroundColor === 'rgb(0, 0, 0)', `${theme}: canvas must stay black`);
      check(contrast(getComputedStyle(row).color, getComputedStyle(canvas).backgroundColor) >= 4.5,
        `${theme}: ordinary log text lacks contrast on black canvas`);
      row.click(); await turn();
      check(contrast(getComputedStyle(row).color, getComputedStyle(row).backgroundColor) >= 4.5,
        `${theme}: inspected row text lacks contrast`);
      const selected = getComputedStyle(row, '::selection');
      check(contrast(selected.color, selected.backgroundColor) >= 4.5, `${theme}: native selection text lacks contrast`);
      row.click(); await turn();
    }
    results.push('D07: ordinary/inspected/native-selection text retains contrast on black canvas under light and dark host colors');
  } finally { for (const [name, value] of previous) { if (value) root.style.setProperty(name, value); else root.style.removeProperty(name); } }
}
async function verifyPresentation() {
  await refresh('first needle\n{"message":"visible","hidden":"needle"}\n{"message":"\\u03a3"}');
  rows()[0].querySelector('.rl-row').click(); button('Find'); await query('needle');
  const current = root.querySelector('.rl-find-current');
  const originalHint = root.querySelector('[aria-label="Match in original text"]');
  check(originalHint, 'Missing Match in original text'); originalHint.click(); await turn();
  check(root.querySelector('.rl-detail-tabs [aria-pressed="true"]').textContent === 'Application text', 'Hidden original did not open Application text');
  check(root.querySelector('.rl-detail pre').textContent === '{"message":"visible","hidden":"needle"}', 'Hidden source changed original');
  check(root.querySelector('.rl-find-current') === current, 'Hidden inspection changed Find result');
  await query('σ');
  root.querySelector('.rl-display-options').open = true; button('Raw');
  const extractedHint = root.querySelector('[aria-label="Match in extracted message"]');
  check(extractedHint, 'Missing Match in extracted message'); extractedHint.click(); await turn();
  check(root.querySelector('.rl-detail-tabs [aria-pressed="true"]').textContent === 'Extracted message', 'Decoded-only source not explicit');
  check(root.querySelector('.rl-detail pre').textContent === 'Σ', 'Extracted representation is not exact decoded string');
  check(root.querySelector('.rl-modes [aria-pressed="true"]').textContent === 'Raw', 'Hint changed Raw mode');
  button('Clear'); root.querySelector('[aria-label="Close Find"]').click();
  selectText(root.querySelector('.rl-detail pre')); button('Find'); await until(settled);
  check(input().value === 'Σ', 'Extracted-message selection did not seed Find from its actual source');
  results.push('D08: original-only and decoded-only hints open exact sources without changing representation or Find result');
  root.querySelector('.rl-display-options').open = true; button('Readable');
  root.querySelector('.rl-display-options').open = false;
  root.querySelector('[aria-label="Close record inspector"]').click(); button('Clear');
  root.querySelector('[aria-label="Close Find"]').click();
}
async function verifySelectionHistory() {
  const byName = name => root.querySelector(`button[aria-label="${name}"]`);
  const clock = () => byName('Search history');
  const historyEntries = () => [...root.querySelectorAll('.rl-history-entry')];
  const historyTexts = () => historyEntries().map(node => node.querySelector('.rl-history-text').textContent);
  const closeFind = () => byName('Close Find').click();
  const clearHistory = () => { clock().click();
    const clear = [...root.querySelectorAll('.rl-history-popover button')].find(node => node.textContent === 'Clear history');
    if (!clear.disabled) clear.click(); byName('Close search history').click(); };
  clock().click(); // Hidden Find controls are mounted but not available to users.
  check(!root.querySelector('.rl-history-popover'), 'Hidden history opened');
  await refresh('first needle\nsecond needle\nsource needle');
  rows()[1].querySelector('.rl-row').click();
  selectText(rows()[2].querySelector('.rl-message'), 7, 13);
  button('Find');
  await until(settled, 'Selection seed did not settle');
  check(input().value === 'needle', 'Empty Find did not seed actual selected log text');
  check(root.querySelector('.rl-find-current')?.dataset.recordIndex === '1', 'Seed chose source record as reading row');
  results.push('D12: selected source captured before focus; seed uses independent reading row');
  // An existing query is never replaced by a newer selection.
  closeFind(); selectText(rows()[0].querySelector('.rl-message'), 0, 5); button('Find');
  check(input().value === 'needle', 'Selected text replaced existing query');
  clearHistory(); button('Clear'); closeFind(); document.getSelection().removeAllRanges();
  // Selection eligibility checks real Range provenance, not DOM labels/textContent.
  const reject = async select => {
    select(); button('Find'); await turn(); check(input().value === '', 'Ineligible selection seeded Find');
    closeFind(); document.getSelection().removeAllRanges();
  };
  const foreign = document.createElement('p'); foreign.textContent = 'foreign'; document.body.append(foreign);
  await reject(() => selectText(foreign)); foreign.remove();
  await reject(() => {
    const range = document.createRange(); range.setStart(rows()[0].querySelector('[data-source-start]').firstChild, 0);
    range.setEnd(rows()[1].querySelector('[data-source-start]').firstChild, 3);
    document.getSelection().addRange(range);
  });
  await refresh('{"message":"needle","extra":1}');
  rows()[0].querySelector('.rl-row').click();
  button('All fields');
  await reject(() => selectText(root.querySelector('.rl-detail-head strong')));
  await reject(() => selectText(root.querySelector('.rl-detail-body p')));
  await reject(() => selectText(root.querySelector('.rl-detail pre'))); // pretty object is multiline
  await reject(() => { const range = document.createRange(); range.selectNodeContents(root.querySelector('.rl-fields')); document.getSelection().addRange(range); });
  button('Application text'); selectText(root.querySelector('.rl-detail pre'), 12, 18); button('Find'); await until(settled);
  check(input().value === 'needle', 'Inspector application selection not captured');
  button('Clear'); closeFind();
  button('Transport line'); selectText(root.querySelector('.rl-detail pre'), 12, 18); button('Find'); await until(settled);
  check(input().value === 'needle', 'Inspector transport selection not captured');
  button('Clear'); closeFind(); button('All fields');
  const pre = root.querySelector('.rl-detail pre'); const start = pre.textContent.indexOf('needle');
  selectText(pre, start, start + 6); button('Find'); await until(settled);
  check(input().value === 'needle', 'Inspector field-value selection not captured');
  button('Clear'); closeFind();
  results.push('D12: existing-query preservation; foreign, multi-record, generated labels/badge and multiline rejection; inspector sources');

  await refresh('😀'.repeat(257));
  selectText(rows()[0].querySelector('.rl-message'), 0, 512); button('Find'); await until(settled);
  check(input().value === '😀'.repeat(256), 'Selection limit used UTF-16 units instead of code points');
  button('Clear'); closeFind(); await reject(() => selectText(rows()[0].querySelector('.rl-message')));
  // Capture on pointerdown, before the browser focuses the toolbar. Moving the
  // Range before click proves that onClick cannot accidentally reread it.
  await refresh('first needle\nsecond needle\nsource needle');
  button('Find'); byName('Match case').click(); byName('Whole words').click(); closeFind();
  selectText(rows()[2].querySelector('.rl-message'), 7, 13);
  const opener = root.querySelector('.rl-toolbar button[aria-label="Find"]');
  opener.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
  document.getSelection().removeAllRanges(); opener.focus();
  opener.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 })); await until(settled);
  check(input().value === 'needle' && byName('Match case').getAttribute('aria-pressed') === 'true' && byName('Whole words').getAttribute('aria-pressed') === 'true', 'Pointer seed lost captured text or flags');
  check(document.activeElement === input() && input().selectionEnd === 6, 'Open did not focus/select seed');
  button('Clear'); closeFind();
  selectText(rows()[0].querySelector('.rl-message'), 0, 5);
  opener.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
  selectText(rows()[2].querySelector('.rl-message'), 7, 13);
  // A keyboard-style activation following an abandoned pointer press must
  // sample the current Range, rather than consume the old pointer capture.
  opener.click(); await until(settled);
  check(input().value === 'needle', 'Keyboard open reused abandoned pointer selection');
  results.push('D12: 256/257 astral code-point boundary, pre-pointer-focus capture and preserved flags/input selection');

  clearHistory();
  // Explicit navigation commits the exact tuple; recall resets its cursor.
  byName('Next match').click();
  clock().click(); check(historyTexts().join() === 'needle', 'Navigation did not commit history');
  check(historyEntries()[0].textContent.includes('Match case') && historyEntries()[0].textContent.includes('Whole words'), 'History flags not visible');
  byName('Close search history').click();
  byName('Match case').click(); await until(settled); closeFind(); button('Find');
  clock().click(); check(historyEntries().length === 2, 'Flag tuples were deduplicated by text alone');
  byName('Close search history').click();
  // Move reading context to row 1; the saved query previously reached row 2.
  rows()[1].querySelector('.rl-row').click();
  clock().click(); historyEntries()[1].click(); await until(settled);
  check(!root.querySelector('.rl-history-popover') && document.activeElement === input(), 'Recall did not close/focus Find');
  check(byName('Match case').getAttribute('aria-pressed') === 'true' && byName('Whole words').getAttribute('aria-pressed') === 'true', 'Recall lost modes');
  check(root.querySelector('.rl-find-current')?.dataset.recordIndex === '1', 'Recall inherited historical cursor');
  closeFind(); button('Find'); clock().click();
  check(historyEntries().length === 2 && historyEntries()[0].textContent.includes('Match case'), 'MRU deduplication failed');
  byName('Close search history').click();
  await query('valid zero'); closeFind(); button('Find'); clock().click();
  check(historyTexts()[0] === 'valid zero', 'Valid zero-hit close was not committed');
  button('Clear history');
  check(input().value === 'valid zero' && !historyEntries().length && root.textContent.includes('No recent searches.'), 'Clear history changed query or lost empty state');
  check(document.activeElement === root.querySelector('.rl-history-popover h3'), 'Clear history lost focus');
  byName('Close search history').click(); check(document.activeElement === clock(), 'Popover close did not return clock focus');
  results.push('D10/D16: navigation/close commitment, exact flag tuples/MRU, current-origin recall, valid zero hits and useful Clear history');

  const skipped = async (value, setup) => {
    button('Clear'); await setup(value); closeFind();
    await sleep(30); button('Find'); clock().click(); check(!historyEntries().length, `${value.slice(0, 20)} was committed`);
    byName('Close search history').click();
  };
  button('Clear'); let gate = holdNext(); edit('unfinished'); await until(() => heldReply === undefined);
  closeFind(); gate.release(); await until(settled); button('Find'); clock().click();
  check(!historyEntries().length, 'Pending close wrote history after completion'); byName('Close search history').click();
  await skipped('failure', async value => { failNext = true; await query(value); });
  await skipped('x'.repeat(16_385), query);
  await skipped('composing', async value => { input().dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })); edit(value); });
  // Finish composition only after it was excluded at Close; completion is not a commitment.
  input().dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'composing' })); await until(settled);
  clock().click(); check(!historyEntries().length, 'Composition completion deferred history'); byName('Close search history').click();
  await skipped('timeout', async value => { gate = holdNext(value); edit(value); await until(() => heldReply === undefined);
    await until(() => root.textContent.includes('Find timed out'), 'History timeout did not settle').catch(error => {
      throw new Error(`${error.message}: ${JSON.stringify({ input: input().value, status: root.querySelector('.rl-find-count').textContent, requestCount, workerQueries: rangeRequests.slice(-3).map(request => request.query) })}`);
    }); gate.release(); await turn(); });
  results.push('D10/D11/D16: pending/composing/oversized/failure/timeout input skipped without deferred writes');

  button('Clear'); await query('retained history'); closeFind(); button('Find');
  button('Edit profiles'); button('Back to logs'); clock().click();
  check(historyTexts()[0] === 'retained history', 'Profiles lost history');
  byName('Close search history').click();
  const visibilityReply = [...callbacks.entries()].find(([name]) => name.startsWith('viewer-visibility-'));
  visibilityReply[1]({}, null); await turn(); visibilityReply[1]({}, 'cluster'); await until(settled);
  clock().click(); check(historyTexts()[0] === 'retained history', 'Temporary inactivity lost history');
  // Outside click and Escape return focus to the clock. Escape is dispatched
  // only with the document's real focus; guards are never patched.
  root.querySelector('.rl-find-count').click();
  check(!root.querySelector('.rl-history-popover') && document.activeElement === clock(), 'Outside click did not return clock focus');
  clock().click(); closeFind();
  check(!root.querySelector('.rl-history-popover') && !root.querySelector('.rl-findbar').hidden && document.activeElement === clock(), 'Outside click dismissed both history and Find');
  clock().click();
  const hostInput = document.createElement('input'); document.body.append(hostInput);
  hostInput.focus(); hostInput.click();
  check(!root.querySelector('.rl-history-popover') && document.activeElement === hostInput, 'History dismissal stole foreign host focus');
  hostInput.remove();
  clock().click();
  if (document.hasFocus()) {
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    check(!root.querySelector('.rl-history-popover') && !root.querySelector('.rl-findbar').hidden && document.activeElement === clock(), 'Escape dismissed more than history');
    clock().click();
  } else {
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    check(!!root.querySelector('.rl-history-popover') && !root.querySelector('.rl-findbar').hidden, 'Unfocused document took Escape ownership');
    results.push('Escape in unfocused headless document stays host-owned; native delivery is unverified');
  }
  // Check responsive popover bounds as real CSS, retaining the black canvas.
  for (const width of [260, 390, 700, 1440]) {
    root.style.width = `${width}px`; await turn();
    const rect = root.querySelector('.rl-history-popover').getBoundingClientRect();
    check(rect.left >= 0 && rect.right <= width + 1, `History overflow at ${width}`);
    check(getComputedStyle(root.querySelector('.rl-records')).backgroundColor === 'rgb(0, 0, 0)', 'History changed black canvas');
    if (globalThis.captureFindHistory) {
      globalThis.findHistoryCaptureWidth = width;
      await until(() => !globalThis.findHistoryCaptureWidth, 'Screenshot capture did not finish');
    }
  }
  root.style.width = ''; byName('Close search history').click();
  results.push('D16: Profiles preserves history, outside-click/close focus, real focus guard, popover fits 260/390/700/1440 widths');
  clearHistory(); button('Clear'); byName('Match case').click(); byName('Whole words').click(); closeFind();
  document.getSelection().removeAllRanges();
}
async function verifyPosition() {
  button('Find'); if (input().value) button('Clear');
  const lines = Array.from({ length: 100 }, (_, i) => [2, 73, 82, 90].includes(i) ? `row ${i} upstream` : `row ${i}`);
  await refresh(lines.join('\n'));
  rows()[64].querySelector('.rl-row').click();
  await query('up');
  const active = () => Number(root.querySelector('.rl-find-current')?.dataset.recordIndex ?? -1);
  check(active() === 73, `Reading row ignored: ${active()}`);
  await query('upstream'); check(active() === 73, 'Refinement advanced');
  root.querySelector('button[aria-label="Next match"]')?.click();
  check(active() === 82, 'Next did not reach 82');
  await query('upstreamx'); check(active() === -1, 'No-match query retained active hit');
  await query('upstream'); check(active() === 82, 'Correction lost refinement candidate');
  input().setSelectionRange(0, input().value.length);
  input().dispatchEvent(new InputEvent('beforeinput', { bubbles: true, inputType: 'insertFromPaste', data: 'upstream' }));
  // React correctly suppresses a redundant onChange for identical native text;
  // the native input transaction must still reach the Find editing boundary.
  input().dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertFromPaste', data: 'upstream' }));
  await until(settled); check(active() === 73, 'Identical full replacement inherited result');
  root.querySelector('button[aria-label="Next match"]').click(); check(active() === 82, 'Next after identical replacement failed');
  input().setSelectionRange(0, input().value.length);
  input().dispatchEvent(new InputEvent('beforeinput', { bubbles: true, inputType: 'insertFromPaste', data: 'ups' }));
  await query('ups'); check(active() === 73, 'Shared-prefix full replacement inherited result');
  input().setSelectionRange(1, 1);
  root.querySelector('[aria-label="Next match"]').click();
  check(active() === 82 && input().selectionStart === 1 && input().selectionEnd === 1, 'Navigation reset native caret');
  input().setSelectionRange(3, 3);
  input().dispatchEvent(new InputEvent('beforeinput', { bubbles: true, inputType: 'insertFromPaste', data: 'tream' }));
  await query('upstream'); check(active() === 82, 'Partial paste started a new query');
  input().setSelectionRange(0, input().value.length);
  input().dispatchEvent(new InputEvent('beforeinput', { bubbles: true, inputType: 'historyUndo' }));
  await query('ups'); check(active() === 82, 'Undo used selected input as a new origin');
  input().dispatchEvent(new InputEvent('beforeinput', { bubbles: true, inputType: 'historyRedo' }));
  await query('upstream'); check(active() === 82, 'Redo lost refinement candidate');
  input().dispatchEvent(new InputEvent('beforeinput', { bubbles: true, inputType: 'deleteByCut' }));
  await query(''); check(active() === -1 && !root.querySelector('.rl-findbar').hidden, 'Cut-to-empty did not end sequence');
  input().dispatchEvent(new InputEvent('beforeinput', { bubbles: true, inputType: 'historyRedo' }));
  await query('upstream'); check(active() === 73, 'Redo across empty did not start from reading row');
  results.push('D01/D04-D06: inclusive reading origin, progressive refinement, typo correction and pre-insertion replacement');
  results.push('D06: mounted partial paste, cut-to-empty and Undo/Redo event classification; navigation preserves native caret');

  // Deliberate Tab intent uses the existing focusable rows, without introducing
  // a navigation scheme. A plain programmatic focus must not rebase Find.
  const tabTo = index => {
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    rows()[index].querySelector('.rl-row').focus({ preventScroll: true });
    // Unfocused headless documents can change activeElement without delivering
    // focus events. Exercise React's event boundary explicitly, without faking
    // document.hasFocus or bypassing local shortcut guards.
    rows()[index].querySelector('.rl-row').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    document.activeElement.dispatchEvent(new KeyboardEvent('keyup', { key: 'Tab', bubbles: true }));
  };
  tabTo(90); await turn(); check(active() === -1 && root.querySelector('.rl-selected')?.dataset.recordIndex === '64', `Keyboard focus conflated reading and inspection: active=${active()} selected=${root.querySelector('.rl-selected')?.dataset.recordIndex}`);
  root.querySelector('button[aria-label="Close record inspector"]').click();
  check(document.activeElement === rows()[64].querySelector('.rl-row'), 'Inspector focus was not restored');
  root.querySelector('[aria-label="Next match"]').click(); check(active() === 90, 'Inspector close lost independent reading row');
  root.querySelector('[aria-label="Next match"]').click(); check(active() === 2 && root.textContent.includes('Wrapped to beginning'), 'Forward wrap missing');
  root.querySelector('[aria-label="Previous match"]').click(); check(active() === 90 && root.textContent.includes('Wrapped to end'), 'Backward wrap missing');
  results.push('D03/D09/D14: independent keyboard reading/inspection, suppressed focus restoration and wrap feedback');

  // Deselecting the origin during current matching may update counts only.
  rows()[64].querySelector('.rl-row').click();
  let gate = holdNext(); edit('ups'); await until(() => heldReply === undefined, 'Pending deselection did not dispatch its edited query');
  rows()[64].querySelector('.rl-row').click();
  const deselectedTop = root.querySelector('.rl-records').scrollTop;
  gate.release(); await until(settled); await turn();
  check(active() === -1 && !root.querySelector('.rl-detail') && root.querySelector('.rl-records').scrollTop === deselectedTop, 'Pending completion resurrected deselected origin or scrolled');
  button('Clear'); await query('up'); check(active() === 2, 'Programmatic focus return recreated reading anchor');

  // The matching selection may finish after a manual scroll, but its older
  // reveal permission cannot move the viewport back to that result.
  gate = holdNext(); edit('upstream'); await until(() => heldReply === undefined);
  const scroller = root.querySelector('.rl-records');
  scroller.scrollTop = 700; await sleep(50); const manualTop = scroller.scrollTop;
  gate.release(); await until(settled); await turn();
  check(active() === 2 && scroller.scrollTop === manualTop, 'Delayed matching undid manual scrolling');
  root.querySelector('[aria-label="Next match"]').click(); check(active() === 73 && scroller.scrollTop !== manualTop, 'Fresh navigation could not reveal');
  results.push('D02/D11/D14/D15: pending deselection prevents selection; manual scroll cancels reveal only; explicit navigation recovers');

  // Same selected input during composition is a new query; final input and
  // duplicate end events must neither reevaluate nor navigate a second time.
  rows()[64].querySelector('.rl-row').click();
  input().setSelectionRange(0, input().value.length);
  const beforeComposition = requestCount;
  input().dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
  edit('ups');
  input().dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', isComposing: true }));
  check(requestCount === beforeComposition, 'Composition Enter executed work');
  input().dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'ups' }));
  await until(settled); check(active() === 73 && requestCount === beforeComposition + 1, 'Composition replacement did not start at reading row exactly once');
  input().dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'ups' }));
  input().dispatchEvent(new Event('input', { bubbles: true })); await turn();
  check(requestCount === beforeComposition + 1, 'Duplicate composition completion reexecuted');
  input().dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })); edit('stale');
  button('Clear'); input().dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'stale' }));
  check(input().value === '', 'Late composition end resurrected cleared query');
  results.push('D06/D11: select-all composition commits once, Enter stays composition-owned, Clear rejects late completion');

  // A profile can remove a decoded-message match without changing application
  // text. Profile maintenance must never fetch or choose a replacement result.
  rows()[64].querySelector('.rl-row').click();
  await refresh('{"message":"pay\\u006dent"}\n{"message":"other"}');
  await query('payment'); check(active() === 0, 'Decoded fixture did not match');
  const beforeProfileReads = reads;
  button('Edit profiles'); button('Duplicate');
  const paths = root.querySelector('textarea[aria-label="Message paths"]');
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(paths, '');
  paths.dispatchEvent(new Event('input', { bubbles: true })); button('Save profile');
  const profileId = root.querySelector('select[aria-label="Saved profile"]').value;
  button('Back to logs');
  const profile = root.querySelector('select[aria-label="Profile"]');
  profile.value = profileId; profile.dispatchEvent(new Event('change', { bubbles: true }));
  await until(settled); check(active() === -1 && root.querySelector('.rl-find-count').textContent === '0 of 0 matching records', 'Profile maintenance chose an absent hit');
  profile.value = ''; profile.dispatchEvent(new Event('change', { bubbles: true }));
  await until(settled); check(active() === -1 && root.querySelector('.rl-find-count').textContent === '0 of 1 matching records', 'Profile maintenance chose a newly gained hit');
  check(reads === beforeProfileReads, 'Profile search maintenance fetched logs');
  root.querySelector('[aria-label="Next match"]').click(); check(active() === 0 && root.textContent.includes('Only matching record'), 'One-hit navigation feedback missing');
  const beforePresentationRequests = requestCount;
  const display = root.querySelector('.rl-display-options'); display.open = true;
  button('Raw');
  const wrap = [...display.querySelectorAll('input')].find(input => input.parentElement.textContent.includes('Word wrap'));
  wrap.click(); await turn();
  check(active() === 0 && requestCount === beforePresentationRequests, 'Presentation changed search identity');
  button('Readable'); wrap.click(); display.open = false;
  results.push('D09/D13: decoded profile maintenance keeps counts separate from selection, never fetches; presentation preserves identity');
  button('Clear'); await refresh(lines.join('\n'));

  const width = root.style.width;
  for (const size of [260, 390, 700, 1440]) {
    root.style.width = `${size}px`; await turn();
    check(root.scrollWidth <= size, `Find overflow at ${size}`);
    check(getComputedStyle(root.querySelector('.rl-records')).backgroundColor === 'rgb(0, 0, 0)', 'Black canvas changed');
  }
  root.style.width = width;
  check(root.querySelector('.rl-findbar').parentElement === root.querySelector('.readable-logs') && !root.querySelector('.rl-toolbar .rl-findbar'), 'Find merged into toolbar');
  check([...root.querySelectorAll('.rl-find-direction .Icon')].map(node => node.textContent).join(',') === 'keyboard_arrow_up,keyboard_arrow_down', 'Wrong host navigation icons');
  results.push('D09/D10/D16: compact separate bar, native icon names, black canvas at 260/390/700/1440 widths');
  root.querySelector('button[aria-label="Close Find"]').click();
}
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
  check([...root.querySelectorAll('.rl-find-direction')].length === 2 && [...root.querySelectorAll('.rl-find-direction')].every(node => node.disabled), 'Pending navigation enabled');
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
  await until(() => root.textContent.includes('Find timed out'), 'Whole-attempt timeout missing');
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
  await document.fonts.ready;
  extension.onActivate();
  const params = Object.fromEntries(Object.entries({ namespace: 'ns', pod: 'pod', podUid: 'uid', clusterId: 'cluster' }).map(([key, value]) => [key, { get: () => value }]));
  ReactDOM.render(<Page params={params} />, root);
  try {
    await until(() => rows().length === 3, 'No initial rows'); button('Pause');
    if (FIND_PERFORMANCE_ONLY) {
      await verifyFindPerformance({ root, rows, button, query, refresh, until, check, results, holdNext, holdNextRange, rangeRequests });
      return results;
    }
    await verifyFindPerformance({ root, rows, button, query, refresh, until, check, results, holdNext, holdNextRange, rangeRequests });
    button('Clear'); root.querySelector('[aria-label="Close Find"]').click(); await refresh('start\nx\nend');
    button('Find'); await query('x');
    const beforeMetadata = { reads: podReads, requests: requestCount };
    await until(() => podReads > beforeMetadata.reads, 'No periodic Pod observation'); await turn();
    check(requestCount === beforeMetadata.requests, 'Unchanged Pod metadata restarted matching');
    check(root.querySelector('.rl-find-current')?.dataset.recordIndex === '1', 'Unchanged Pod metadata lost the active result');
    button('Clear'); root.querySelector('[aria-label="Close Find"]').click();
    results.push('unchanged periodic Pod metadata preserves matching and the active result while paused');
    await verifyInspectionFindState();
    await verifyCanvasContrast();
    await verifyPresentation();
    await verifyFindPresentation({ root, rows, button, query, refresh, until, check, turn, results, rangeRequests, failRanges: () => { failNextRange = true; } });
    await verifyFindMarks({ root, rows, button, query, refresh, until, check, turn, results, failRanges: () => { failNextRange = true; } });
    await verifyFindIntegration({ root, rows, button, query, refresh, until, check, turn, results, failRanges: () => { failNextRange = true; }, selectText, copies });
    await verifySelectionHistory();
    await verifyAsync();
    await verifyPosition();
    await refresh('start\nx\nend');
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
    const beforeCopies = copies.length;
    button('Copy application text'); button('Copy transport line');
    check(copies.length === beforeCopies + 2 && copies.slice(beforeCopies).every(value => value === 'x'), 'Original copy payload changed');
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
    root.querySelector('[aria-label="Close Find"]').click(); button('Find');
    const assertEmptyHistory = () => {
      root.querySelector('[aria-label="Search history"]').click();
      check(!root.querySelector('.rl-history-entry'), 'New context retained history');
      root.querySelector('[aria-label="Close search history"]').click();
    };
    status = undefined; await sleep(3100);
    check(input().value === 'x', 'Missing metadata spuriously reset query');
    status = { name: 'app', restartCount: 0, containerID: 'run-0' }; await sleep(3100);
    check(input().value === 'x', 'Unchanged metadata reset query');
    for (const count of [1, 2]) {
      status = { name: 'app', restartCount: count };
      await until(() => input().value === '' && rows().length === 0, 'Paused restart did not reset Find and records');
      assertEmptyHistory();
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
    check(input().value === '', 'Container change retained query'); assertEmptyHistory();
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
    check(localStorage.length === 0 && sessionStorage.length === 0 && !(await indexedDB.databases()).length, 'Find wrote browser storage');
  } finally {
    ReactDOM.unmountComponentAtNode(root); await extension.onDeactivate(); await turn();
  }
  check(callbacks.size === 0, 'IPC listener leak'); check(errors.length === 0, errors.join('; '));
  check(CSS.highlights.size === 0, 'Viewer teardown retained Custom Highlight registrations');
  check(geometryObservers.size === 0 && geometryFrames.size === 0, 'Viewer teardown retained geometry observers/animation frames');
  results.push('unmount removes all geometry Mutation/Resize observers and pending animation frames');
  return { checks: results, reads, errors };
};
