// Check the diagnostic itself against actual attached/removed/once listeners.
import assert from 'node:assert/strict';
import { driver, report } from './driver.mjs';
import { traceAbortListeners } from './listener-signals.mjs';
import { privateSession } from './private-session.mjs';

const d = await driver(), result = { session: privateSession() };
let trace;
try {
  trace = await traceAbortListeners(d.page, { allTargets: true });
  await d.page.evaluate(`(()=>{
    const active=new AbortController(),removed=new AbortController(),aborted=new AbortController();
    const callbacks=[()=>{},()=>{},()=>{}];
    active.signal.addEventListener('abort',callbacks[0],{once:true});
    removed.signal.addEventListener('abort',callbacks[1]);removed.signal.removeEventListener('abort',callbacks[1]);
    aborted.signal.addEventListener('abort',callbacks[2],{once:true});aborted.abort();
    const detached=document.createElement('div');detached.className='diagnostic-owned-detached';
    detached.addEventListener('diagnostic-owned-event',callbacks[0]);
    const child=document.createElement('div');detached.append(child);child.addEventListener('diagnostic-owned-event',callbacks[0]);
    global.__abortCensusCheck={active,removed,aborted,detached,callbacks};return true;
  })()`, d.cluster());
  result.reachable = await trace.sample();
  result.attached = await trace.attached();
  const cluster = result.attached.samples.find(s => s.frame === 'cluster');
  assert.equal(cluster.targets, 5);
  assert.deepEqual(cluster.rows.map(r => r.listeners.length), [1, 0, 0, 2, 1]);
  assert.equal(cluster.attached, 3, 'Overlapping parent/child census must not double count the child listener');
  assert.equal(cluster.rows[3].target, 'DIV.diagnostic-owned-detached');
  assert.equal(cluster.rows[3].connected, false);
  assert.equal(result.reachable.find(s => s.frame === 'cluster').live.length, 5);
  result.pass = true;
} catch (error) { result.error = error.stack; process.exitCode = 1; }
finally {
  await d.page.evaluate('delete global.__abortCensusCheck;true', d.cluster());
  if (trace) await trace.dispose();
  result.restored = await d.page.evaluate('!global.__findAbortTrace', d.cluster());
  report('abort-census-check', result); console.log(JSON.stringify({ pass: result.pass, error: result.error })); d.close();
}
