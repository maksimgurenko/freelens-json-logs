// Private, read-only Kubernetes watch control. No viewer, Find or native input.
// Timer cancellation is a diagnostic intervention, never a host/product patch.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { driver, report, sleep } from './driver.mjs';
import { privateSession } from './private-session.mjs';
import { evidence } from './config.mjs';
import { traceAbortListeners } from './listener-signals.mjs';

const d = await driver();
const result = { session: privateSession(), scenarios: [],
  scope: 'Actual installed podsApi.watch against the owned namespace, default 600-second timeout; wait for its response timer before aborting. Instrumented attribution control, not Find acceptance.' };
const evaluate = code => d.page.evaluate(code, d.cluster());
let trace, installed = false;
try {
  await d.bind(d.cluster());
  assert.equal(await evaluate('document.querySelectorAll(".readable-logs").length'), 0);
  const fixture = JSON.parse(readFileSync(`${evidence}/fixture.json`));
  const kube = ['--context', 'kind-freelens-json-logs-spike', '-n', fixture.namespace];
  const namespace = JSON.parse(execFileSync('kubectl', ['--context', 'kind-freelens-json-logs-spike',
    'get', 'namespace', fixture.namespace, '-o', 'json'], { encoding: 'utf8' }));
  assert.equal(namespace.metadata.uid, fixture.namespaceUid, 'Owned fixture namespace changed');
  assert.equal(namespace.metadata.labels['find-verification'], '48', 'Not a verification fixture');
  const pod = JSON.parse(execFileSync('kubectl', [...kube, 'get', 'pod', 'find-fixtures', '-o', 'json'], { encoding: 'utf8' }));
  assert.equal(pod.metadata.uid, fixture.podUid, 'Owned fixture Pod changed');
  trace = await traceAbortListeners(d.page);
  await evaluate(`(() => {
    if (global.__findWatchTimers) throw Error('Watch diagnostic already installed');
    const originalSet = global.setTimeout, originalClear = global.clearTimeout;
    const state = { originalSet, originalClear, records: [], stop: null, parent: null };
    state.set = function(callback, delay, ...args) {
      const id = Reflect.apply(originalSet, global, [callback, delay, ...args]);
      if (Math.abs(delay - 660000) < 1) {
        if (state.records.length >= 64) throw Error('Watch timer cap exceeded');
        state.records.push({ id, delay, callback: new WeakRef(callback), cleared: false });
      }
      return id;
    };
    state.clear = function(id) {
      for (const record of state.records) if (record.id === id) record.cleared = true;
      return Reflect.apply(originalClear, global, arguments);
    };
    global.setTimeout = state.set; global.clearTimeout = state.clear;
    global.__findWatchTimers = state;
    return true;
  })()`);
  installed = true;
  for (const cancelTimer of [false, true]) {
    const scenario = { cancelTimer, samples: [] };
    result.scenarios.push(scenario);
    for (let cycle = -1; cycle < 8; cycle++) {
      const previous = await evaluate(`(() => {
        const s = global.__findWatchTimers;
        const previous = s.records.length;
        s.parent = new AbortController();
        s.stop = LensExtensions.Renderer.K8sApi.podsApi.watch({
          namespace: ${JSON.stringify(fixture.namespace)}, abortController: s.parent
        });
        return previous;
      })()`);
      // Kubernetes may wait for an event before flushing watch response headers.
      // Change only this UID-checked disposable fixture to produce that event.
      execFileSync('kubectl', [...kube, 'annotate', 'pod', 'find-fixtures',
        `find-resource-probe=${Number(cancelTimer)}-${cycle}`, '--overwrite'], { stdio: 'pipe' });
      let ready = false;
      for (let i = 0; i < 200; i++) {
        ready = await evaluate(`global.__findWatchTimers.records.length === ${previous + 1}`);
        if (ready) break;
        await sleep(10);
      }
      assert(ready, 'Actual watch response did not schedule exactly one 660-second timer');
      await evaluate(`(() => {
        const s = global.__findWatchTimers;
        s.parent.abort(); s.stop(); s.parent = s.stop = null;
        if (${cancelTimer}) clearTimeout(s.records[${previous}].id);
        return true;
      })()`);
      await sleep(50);
      await d.page.send('Runtime.discardConsoleEntries');
      await d.page.send('HeapProfiler.collectGarbage');
      const sample = { cycle, dom: await d.page.send('Memory.getDOMCounters'),
        trace: await trace.sample(), attached: await trace.attached(),
        timers: await evaluate(`global.__findWatchTimers.records.map(r => ({delay:r.delay,cleared:r.cleared,callbackReachable:!!r.callback.deref()}))`) };
      if (cycle >= 0) scenario.samples.push(sample);
    }
    const first = scenario.samples[0];
    scenario.growth = scenario.samples.map(s => ({ cycle: s.cycle,
      nodes: s.dom.nodes - first.dom.nodes,
      listeners: s.dom.jsEventListeners - first.dom.jsEventListeners }));
    console.log(JSON.stringify({ cancelTimer, growth: scenario.growth }));
  }
  const control = result.scenarios[0].growth.at(-1);
  const treatment = result.scenarios[1].growth.at(-1);
  result.reproduced = control.listeners > 8;
  result.cancellationPreventsGrowth = treatment.listeners <= 8 && treatment.listeners < control.listeners;
  assert(result.reproduced, 'Host-only control did not reproduce the listener threshold violation');
  assert(result.cancellationPreventsGrowth, 'Cancelling only the watch timeout did not reduce listener growth');
  result.pass = true;
} catch (error) { result.error = error.stack; result.pass = false; process.exitCode = 1; }
finally {
  try {
    if (installed) {
      result.timerCleanup = await evaluate(`(() => {
        const s = global.__findWatchTimers;
        if (global.setTimeout !== s.set || global.clearTimeout !== s.clear) throw Error('Timer methods changed');
        try {
          s.parent?.abort(); s.stop?.(); s.parent = s.stop = null;
          for (const r of s.records) Reflect.apply(s.originalClear, global, [r.id]);
        } finally {
          global.setTimeout = s.originalSet; global.clearTimeout = s.originalClear;
          delete global.__findWatchTimers;
        }
        return { restored:true, cancelled:s.records.length };
      })()`);
      await sleep(100);
      await d.page.send('HeapProfiler.collectGarbage');
      result.afterTimerCleanup = { dom: await d.page.send('Memory.getDOMCounters'), attached: await trace.attached() };
    }
  } catch (error) { result.cleanupError = error.stack; result.pass = false; process.exitCode = 1; }
  try {
    if (trace) { await trace.dispose(); result.traceRestored = true; }
  } catch (error) { result.traceCleanupError = error.stack; result.pass = false; process.exitCode = 1; }
  report('watch-retention', result);
  console.log(JSON.stringify({ pass: result.pass, reproduced: result.reproduced,
    cancellationPreventsGrowth: result.cancellationPreventsGrowth, error: result.error,
    cleanupError: result.cleanupError, traceCleanupError: result.traceCleanupError }));
  d.close();
}
