// Real-host verification only. Does not replace the SDK or fabricate log responses.
// Usage: node docs/verification/12/host-controls.mjs <controls|denied|offline|slow|initial> <output.json>
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const [mode, output] = process.argv.slice(2);
const targets = await (await fetch('http://127.0.0.1:9235/json/list')).json();
const page = targets.find(target => target.type === 'page');
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
let nextId = 0;
const pending = new Map();
const contexts = [];
let requests = [];
const states = [];
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) {
    const callback = pending.get(message.id);
    pending.delete(message.id);
    if (callback) message.error ? callback.reject(message.error) : callback.resolve(message.result);
  }
  if (message.method === 'Runtime.executionContextCreated') contexts.push(message.params.context);
});
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let context;
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, contextId: context.id, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const state = async label => {
  const value = await evaluate(`(() => {const e=document.querySelector('.readable-logs');return {version:e?.dataset.version,text:e?.innerText,rows:[...document.querySelectorAll('.rl-row')].map(r=>r.innerText),buttons:[...e.querySelectorAll('button')].map(b=>({text:b.textContent,disabled:b.disabled})),url:location.href};})()`);
  requests = await evaluate('global.__rl12.records');
  states.push({ label, at: Date.now(), requests: requests.length, ...value });
  if (['denied', 'offline-failure', 'slow'].includes(label)) {
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(output.replace(/\.json$/, `-${label}.png`), Buffer.from(data, 'base64'));
  }
  return value;
};
const click = label => evaluate(`(() => {const b=[...document.querySelectorAll('.readable-logs button')].find(b=>b.textContent===${JSON.stringify(label)});if(!b||b.disabled)throw Error('Unavailable control '+${JSON.stringify(label)});b.click();return true;})()`);
try {
  await send('Runtime.enable');
  context = contexts.find(c => c.auxData?.isDefault && c.origin.includes('770814'));
  assert(context, 'Cluster context missing');
  await evaluate(readFileSync(new URL('./host-transport.js', import.meta.url), 'utf8'));
  assert.equal((await state('start')).version, '0.1.2');
  if (mode === 'controls') {
    await sleep(6_500); await state('automatic-cadence');
    await click('Pause'); const paused = await state('pause');
    await sleep(4_000); const frozen = await state('still-paused');
    assert.deepEqual(frozen.rows, paused.rows);
    await click('Refresh'); await sleep(700); const manual = await state('manual-refresh');
    assert(manual.buttons.some(b => b.text === 'Resume')); assert.notDeepEqual(manual.rows, frozen.rows);
    await sleep(3_500); const once = await state('manual-remains-paused');
    assert.deepEqual(once.rows, manual.rows);
    await click('Resume'); await sleep(700); await state('resumed');
    await sleep(3_500); await state('automatic-after-resume');
  } else if (mode === 'initial') {
    const route = await evaluate('location.pathname+location.search');
    await evaluate("global.LensExtensions.Renderer.Navigation.navigate('/pods')");
    await sleep(200);
    await evaluate('global.__rl12.denied = true');
    await evaluate(`global.LensExtensions.Renderer.Navigation.navigate(${JSON.stringify(route)})`);
    await sleep(1_000); const initial = await state('initial-denial');
    assert.equal(initial.rows.length, 0); assert(initial.text.includes('Unable to read logs'));
    assert(!initial.text.includes('No logs returned'));
    await click('Pause'); await evaluate('global.__rl12.denied = false');
    await click('Retry'); await sleep(1_000); const recovered = await state('paused-retry-success');
    assert(recovered.rows.length > 0); assert(recovered.buttons.some(b => b.text === 'Resume'));
    await sleep(3_500); const frozen = await state('paused-retry-remains-paused');
    assert.deepEqual(frozen.rows, recovered.rows);
    assert.equal(states.at(-1).requests, states.at(-2).requests);
    await click('Resume'); await sleep(700); await state('resumed-after-paused-retry');
  } else if (mode === 'denied') {
    await click('Pause');
    await evaluate('global.__rl12.denied = true');
    await click('Resume'); await sleep(1_000); await state('denied');
    await sleep(4_000); await state('stopped-after-denial');
    await click('Retry'); await sleep(1_000); await state('failed-retry');
    await sleep(3_500); await state('stopped-after-failed-retry');
    await evaluate('global.__rl12.denied = false');
    await click('Retry'); await sleep(1_000); await state('recovered');
    await sleep(3_500); await state('automatic-after-retry');
  } else if (mode === 'offline') {
    await click('Pause');
    await evaluate('global.__rl12.offline = true');
    await click('Resume'); await sleep(1_000); await state('offline-failure');
    await sleep(4_000); await state('offline-stopped');
    await click('Retry'); await sleep(700); await state('offline-failed-retry');
    await evaluate('global.__rl12.offline = false');
    await click('Retry'); await sleep(1_000); await state('online-recovered');
    await sleep(3_500); await state('online-automatic');
  } else if (mode === 'slow') {
    await click('Pause'); await evaluate('global.__rl12.hold = true');
    await click('Resume'); await sleep(15_200); const slow = await state('slow');
    assert(slow.text.includes('longer than 15 seconds')); assert.equal(await evaluate('global.__rl12.held.length'), 1, 'Request not held');
    const beforePause = Date.now(); await click('Pause');
    const paused = await state('paused-slow'); states.at(-1).actionRoundTripMs = Date.now() - beforePause;
    assert(paused.buttons.some(b => b.text === 'Resume'));
    await click('Resume'); await sleep(300); await state('waiting-for-invalidated');
    const route = await evaluate('location.pathname+location.search');
    const navigationStart = Date.now();
    await evaluate("global.LensExtensions.Renderer.Navigation.navigate('/pods')");
    const departed = await evaluate("({viewerAbsent: !document.querySelector('.readable-logs'), pathname:location.pathname})");
    assert(departed.viewerAbsent);
    states.push({ label: 'departed-during-outstanding-read', at: Date.now(), actionRoundTripMs: Date.now()-navigationStart, ...departed });
    await evaluate(`global.LensExtensions.Renderer.Navigation.navigate(${JSON.stringify(route)})`);
    await sleep(200); const reopened = await state('reopened-waits-for-outstanding');
    assert.equal(reopened.rows.length, 0); assert(reopened.text.includes('Waiting for the earlier request'));
    await evaluate('(() => {global.__rl12.hold=false;for(const release of global.__rl12.held.splice(0))release();})()');
    await sleep(1_000); await state('fresh-after-invalidated');
  } else throw new Error(`Unknown scenario ${mode}`);
  const byLabel = label => states.find(state => state.label === label);
  if (mode === 'denied' || mode === 'offline') {
    const failure = byLabel(mode === 'denied' ? 'denied' : 'offline-failure');
    const stopped = byLabel(mode === 'denied' ? 'stopped-after-denial' : 'offline-stopped');
    const failedRetry = byLabel(mode === 'denied' ? 'failed-retry' : 'offline-failed-retry');
    const recovered = byLabel(mode === 'denied' ? 'recovered' : 'online-recovered');
    const automatic = byLabel(mode === 'denied' ? 'automatic-after-retry' : 'online-automatic');
    assert(failure.text.includes('Logs are outdated'));
    assert.deepEqual(failure.rows, states[0].rows);
    assert.equal(stopped.requests, failure.requests);
    assert.equal(failedRetry.requests, failure.requests + 1);
    assert(!recovered.text.includes('Logs are outdated'));
    assert.equal(automatic.requests, recovered.requests + 1);
    if (mode === 'denied') {
      assert.equal(requests[0].status, 403);
      assert.equal(JSON.parse(requests[0].body).reason, 'Forbidden');
      assert.equal(byLabel('stopped-after-failed-retry').requests, failedRetry.requests);
    } else assert(requests[0].error.includes('ECONNREFUSED'));
  }
  if (mode === 'controls') {
    assert(byLabel('automatic-cadence').requests >= 2);
    assert.equal(byLabel('pause').requests, byLabel('still-paused').requests);
    assert.equal(byLabel('manual-refresh').requests, byLabel('pause').requests + 1);
    assert.equal(byLabel('manual-remains-paused').requests, byLabel('manual-refresh').requests);
    assert.equal(byLabel('resumed').requests, byLabel('manual-refresh').requests + 1);
    assert.equal(byLabel('automatic-after-resume').requests, byLabel('resumed').requests + 1);
  }
  if (mode === 'slow') {
    assert.equal(byLabel('waiting-for-invalidated').requests, 1);
    assert.equal(byLabel('fresh-after-invalidated').requests, 2);
    assert(requests[1].started >= requests[0].settled);
  }

} catch (error) {
  states.push({ error: String(error) }); process.exitCode = 1;
} finally {
  // Restore the original Node transports, including releasing any held request.
  requests = await evaluate('global.__rl12.records');
  await evaluate('global.__rl12.restore()');
  const summaries = states.map(({ rows, text, ...state }) => ({ ...state, text: text?.split('\n').slice(0, 30).join('\n'), rowCount: rows?.length, firstRow: rows?.[0], lastRow: rows?.at(-1), rowsSha256: rows && createHash('sha256').update(JSON.stringify(rows)).digest('hex') }));
  writeFileSync(output, JSON.stringify({ mode, at: new Date().toISOString(), requests, states: summaries, restored: true }, null, 2) + '\n');
  socket.close();
}
