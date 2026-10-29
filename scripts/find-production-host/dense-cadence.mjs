// Minimise dense rendering cadence using the actual installed package. The frame
// guard diagnoses scheduling only; it is not a native input latency requirement.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { driver, report, sleep } from './driver.mjs';
import { privateSession } from './private-session.mjs';
import { evidence } from './config.mjs';

const variant = process.env.FIND_DENSE_VARIANT || 'baseline';
assert(['baseline', 'fixed-feedback'].includes(variant));
const d = await driver(), result = { session: privateSession(), samples: [],
  variant, scope: 'Private diagnostic compositor, natural DOM frames, installed production renderer/worker. No native input or latency acceptance.' };
const evaluate = code => d.page.evaluate(code, d.cluster());
let timedOut = false;
const guard = setTimeout(() => { timedOut = true; d.close(); }, 45_000);
const until = async code => {
  for (let i = 0; i < 150; i++) { if (await evaluate(code)) return; await sleep(20); }
  throw Error('Dense precondition did not settle: ' + code);
};
try {
  await d.bind(d.cluster());
  const fixture = JSON.parse(readFileSync(`${evidence}/fixture.json`));
  const clusterId = await evaluate('LensExtensions.Renderer.Catalog.getActiveCluster().id');
  await evaluate("LensExtensions.Renderer.Navigation.navigate('/overview');true");
  await d.wait(s => !s.live && !s.service.owners);
  await evaluate(`__findRenderer.navigate('readable-logs',${JSON.stringify({ namespace: fixture.namespace, pod: 'find-fixtures', podUid: fixture.podUid, clusterId })});true`);
  await until('document.querySelectorAll(".rl-record").length===120');
  await evaluate(`(()=>{const e=document.querySelector('[aria-label="Container"]');e.value='dense';e.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
  await until('document.querySelectorAll(".rl-record").length===1000');
  await evaluate(`globalThis.__dense48={button(name){const b=[...document.querySelector('.readable-logs').querySelectorAll('button')].find(b=>b.getAttribute('aria-label')===name||b.textContent.trim()===name);if(!b||b.disabled)throw Error('Missing enabled '+name);b.click()},
    edit(text){const e=document.querySelector('#rl-find');e.setSelectionRange(0,e.value.length);e.dispatchEvent(new InputEvent('beforeinput',{bubbles:true,inputType:'insertFromPaste',data:text}));Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,text);e.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertFromPaste',data:text}))}};__dense48.button('Pause');__dense48.button('Find');true`);
  const wrapped = process.env.FIND_DENSE_WRAP !== '0'; result.wrapped = wrapped;
  if (wrapped) await evaluate(`(()=>{const e=[...document.querySelectorAll('.rl-display-panel label')].find(l=>l.textContent.includes('Word wrap')).querySelector('input');if(!e.checked)e.click();return true})()`);
  await d.page.send('Performance.enable');
  if (variant === 'fixed-feedback') await evaluate(`(()=>{const style=document.createElement('style');style.id='dense48-diagnostic';style.textContent='.readable-logs .rl-findbar{height:140px;min-height:140px;max-height:140px;overflow:hidden;flex-shrink:0}';document.head.append(style);return true})()`);
  await evaluate(`globalThis.__dense48Trace=[];globalThis.__dense48Observer=new MutationObserver(records=>{for(const record of records){if(record.target.closest?.('.rl-highlight-status')||[...record.addedNodes,...record.removedNodes].some(n=>n.classList?.contains('rl-highlight-status'))){const e=document.querySelector('.rl-records');if(__dense48Trace.length<200)__dense48Trace.push({at:performance.now(),text:document.querySelector('.rl-highlight-status')?.textContent,height:e.clientHeight,top:e.scrollTop})}}});__dense48Observer.observe(document.querySelector('.readable-logs'),{childList:true,subtree:true,characterData:true});true`);
  for (const text of ['', 'absent-dense-probe', 'a']) {
    await evaluate(`__dense48.edit(${JSON.stringify(text)});true`);
    await until(text ? 'document.querySelector(".rl-find-count")?.textContent.includes("matching records")' : 'document.querySelector("#rl-find").value===""');
    const before = await d.page.send('Performance.getMetrics');
    const observed = performance.now();
    const sample = await evaluate(`new Promise(resolve=>{
      const started=performance.now(),times=[],heights=[];let frame;
      const finish=()=>{clearTimeout(timer);cancelAnimationFrame(frame);const s=document.querySelector('.rl-records');resolve({elapsedMs:performance.now()-started,times,heights,count:document.querySelector('.rl-find-count')?.textContent,feedback:document.querySelector('.rl-highlight-status')?.textContent,highlights:[...CSS.highlights].reduce((n,[,h])=>n+h.size,0),rows:document.querySelectorAll('.rl-record').length,top:s.scrollTop,scrollHeight:s.scrollHeight,clientHeight:s.clientHeight,focused:document.hasFocus()})};
      const tick=t=>{times.push(t);heights.push(document.querySelector('.rl-records').clientHeight);if(times.length===12)finish();else frame=requestAnimationFrame(tick)};
      const timer=setTimeout(finish,3000);frame=requestAnimationFrame(tick);
    })`);
    const after = await d.page.send('Performance.getMetrics');
    const values = metrics => Object.fromEntries(metrics.metrics.map(m => [m.name, m.value]));
    const a = values(before), b = values(after);
    Object.assign(sample, { text, callerElapsedMs: performance.now() - observed,
      metrics: Object.fromEntries(['LayoutCount','LayoutDuration','RecalcStyleCount','RecalcStyleDuration','ScriptDuration','TaskDuration'].map(n=>[n,b[n]-a[n]])) });
    sample.transitions = await evaluate('__dense48Trace.splice(0)');
    result.samples.push(sample); console.log(JSON.stringify({ text, frames: sample.times.length, elapsedMs: sample.elapsedMs, callerElapsedMs: sample.callerElapsedMs, metrics: sample.metrics }));
  }
  const dense=result.samples.at(-1);
  assert(dense.highlights>0&&dense.highlights<=1024,'Dense sample lost visible bounded highlights');
  assert.equal(dense.count,'1 of 1000 matching records');
  assert.equal(new Set(dense.heights).size,1,'Feedback repeatedly resized its own clip');
  result.activations = [];
  for (let i = 0; i < 3; i++) {
    const started = performance.now();
    const sample = await evaluate(`(async()=>{const mark=document.querySelector('.rl-find-mark');if(!mark)throw Error('Missing measured mark');const label=mark.getAttribute('aria-label');mark.click();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return{label,active:document.querySelector('.rl-find-current')?.dataset.recordIndex,count:document.querySelector('.rl-find-count')?.textContent,feedback:document.querySelector('.rl-highlight-status')?.textContent}})()`);
    sample.callerElapsedMs = performance.now() - started; result.activations.push(sample);
    assert.equal(Number(sample.active),i,'First measured group skipped a current member'); console.log(JSON.stringify(sample));
  }
  assert(result.samples.every(s => s.times.length === 12), 'Natural 12-frame diagnostic guard failed (3 seconds); not a native latency bound');
  result.pass = true;
} catch (error) { result.pass = false; result.error = error.stack; process.exitCode = 1; }
finally {
  clearTimeout(guard); result.timedOut = timedOut;
  if (!timedOut) {
    await evaluate("globalThis.__dense48Observer?.disconnect();delete globalThis.__dense48Observer;delete globalThis.__dense48Trace;document.querySelector('#dense48-diagnostic')?.remove();true").catch(() => {});
    await evaluate("LensExtensions.Renderer.Navigation.navigate('/overview');delete globalThis.__dense48;true").catch(() => {});
    result.closed = await d.wait(s => !s.live && !s.service.owners && !s.service.retiring).catch(error => ({ error: error.message }));
  }
  report(`dense-cadence-${result.wrapped ? 'wrap' : 'nowrap'}-${variant}`, result); console.log(JSON.stringify({ pass: result.pass, error: result.error, timedOut })); d.close();
}
