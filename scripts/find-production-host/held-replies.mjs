// Installed renderer/worker + SDK. Hold completed replies at the SDK delivery
// boundary; injected transport failures are explicitly controlled evidence.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { driver, report, sleep } from './driver.mjs';
import { privateSession } from './private-session.mjs';
import { evidence } from './config.mjs';

const d = await driver(), result = { session: privateSession(), checks: [],
  scope: 'Actual packed matching/SDK with held delivery and injected transport errors. DOM input only; no native latency claim.' };
const evaluate = code => d.page.evaluate(code, d.cluster());
const check = (ok, label) => { assert(ok, label); result.checks.push(label); };
const until = async code => {
  for (let i = 0; i < 250; i++) { if (await evaluate(code)) return; await sleep(10); }
  throw Error('Held-reply DOM condition did not settle: ' + await evaluate('document.querySelector(".rl-findbar")?.innerText'));
};
const button = name => evaluate(`__held48.button(${JSON.stringify(name)})`);
const edit = text => evaluate(`__held48.edit(${JSON.stringify(text)})`);
const ready = () => until('__held48.count().includes("matching records")');
const arm = async (text, mode = 'hold', work = 'match') => {
  await d.main.evaluate(`__held48.arm(${JSON.stringify({ text, mode, work })});true`);
};
const captured = async () => {
  for (let i = 0; i < 200; i++) {
    if (await d.main.evaluate('__held48.held.length>0')) return;
    await sleep(5);
  }
  throw Error('SDK reply not captured');
};
const release = fail => d.main.evaluate(`__held48.release(${!!fail});true`);
try {
  await d.bind(d.cluster());
  await evaluate("LensExtensions.Renderer.Navigation.navigate('/overview');true"); await d.wait(s => !s.live && !s.service.owners);
  // Preserve the actual SDK handler/sender binding and real worker operation.
  // Only delivery is held or replaced by an explicit transport error.
  await d.main.evaluate(`(()=>{const ipc=process.mainModule.require('electron').ipcMain;
    const channel=[...ipc._invokeHandlers.keys()].find(x=>x.endsWith(':find-request'));
    if(!channel||global.__held48)throw Error('Fresh production SDK handler required');
    const original=ipc._invokeHandlers.get(channel),state=global.__held48={channel,original,held:[],calls:[],next:undefined,
      arm(value){if(this.held.length||this.next)throw Error('Unreleased gate');this.next=value},
      release(fail){for(const h of this.held.splice(0))fail?h.reject(Error('Controlled late transport failure')):h.resolve(h.value)}};
    ipc._invokeHandlers.set(channel,async(event,token,request)=>{state.calls.push({work:request.work,text:request.query.text,key:request.key});
      const gate=state.next?.text===request.query.text&&state.next.work===request.work?state.next:undefined;if(gate)state.next=undefined;
      const value=await original(event,token,request);if(!gate)return value;
      if(gate.mode==='fail')throw Error('Controlled transport failure after actual worker completion');
      return new Promise((resolve,reject)=>state.held.push({resolve,reject,value}));});return true})()`);
  const fixture = JSON.parse(readFileSync(`${evidence}/fixture.json`));
  const clusterId = await evaluate('LensExtensions.Renderer.Catalog.getActiveCluster().id');
  await evaluate(`__findRenderer.navigate('readable-logs',${JSON.stringify({ namespace: fixture.namespace, pod: 'find-fixtures', podUid: fixture.podUid, clusterId })});true`);
  await until('document.querySelectorAll(".rl-record").length===120');
  await evaluate(`globalThis.__held48={root:()=>document.querySelector('.readable-logs'),input:()=>document.querySelector('#rl-find'),count:()=>document.querySelector('.rl-find-count')?.textContent,active:()=>Number(document.querySelector('.rl-find-current')?.dataset.recordIndex??-1),next:()=>document.querySelector('[aria-label="Next match"]'),
    button(name){const b=[...this.root().querySelectorAll('button')].find(b=>b.getAttribute('aria-label')===name||b.textContent.trim()===name);if(!b||b.disabled)throw Error('Missing enabled '+name);b.click()},
    edit(text){const e=this.input();e.setSelectionRange(0,e.value.length);e.dispatchEvent(new InputEvent('beforeinput',{bubbles:true,inputType:'insertFromPaste',data:text}));Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,text);e.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertFromPaste',data:text}))}};true`);
  await button('Pause'); await button('Find');
  await evaluate('document.querySelectorAll(".rl-record")[64].querySelector(".rl-row").click();true');
  await arm('upstream'); await edit('upstream'); await captured();
  check(await evaluate('__held48.next().disabled'), 'Pending held SDK delivery disables navigation immediately');
  await button('Close record inspector'); await release(false); await ready();
  check(await evaluate('__held48.count()==="0 of 4 matching records" && __held48.active()===-1 && !document.querySelector(".rl-detail")'), 'Trace 5 held current success after inspector dismissal updates counts without restoring origin/inspector/result');

  await arm('upstream'); await edit('upstream'); await captured();
  await edit('payment'); await ready(); await release(false); await sleep(50);
  check(await evaluate('__held48.input().value==="payment" && __held48.count()==="1 of 1 matching records" && __held48.active()===11'), 'Trace 6 late actual success cannot replace newer query/result');
  await arm('upstream'); await edit('upstream'); await captured();
  await edit('payment'); await ready(); await release(true); await sleep(50);
  check(await evaluate('__held48.count()==="1 of 1 matching records" && ![...__held48.root().querySelectorAll("button")].some(b=>b.textContent==="Retry")'), 'Trace 6 controlled stale transport failure cannot fail newer successful input');

  await arm('upstream'); await edit('upstream'); await captured();
  await evaluate(`(()=>{const s=document.querySelector('.rl-records');s.scrollTop=1200;s.dispatchEvent(new Event('scroll'));__held48.top=s.scrollTop;return true})()`);
  await release(false); await ready();
  check(await evaluate('__held48.active()===2 && document.querySelector(".rl-records").scrollTop===__held48.top'), 'Trace 7 held current success may select but cannot undo intervening manual scroll');
  await arm('payment'); await edit('payment'); await captured(); await button('Close Find'); await release(false); await sleep(30); await button('Find'); await ready();
  check(await evaluate('__held48.active()===-1'), 'Trace 7 Close/return never replays held selection intent');

  await arm('upstream'); await edit('upstream'); await captured();
  await until('__held48.root().textContent.includes("timed out")');
  check(await evaluate('__held48.input().value==="upstream" && __held48.next().disabled'), 'D11 renderer whole-attempt timeout preserves editable input and disabled navigation');
  await release(false); await sleep(30);
  check(await evaluate('__held48.root().textContent.includes("timed out")'), 'Late success cannot clear timeout latch');
  const calls = await d.main.evaluate('__held48.calls.length'); await button('Refresh'); await sleep(150);
  check(await d.main.evaluate('__held48.calls.length') === calls, 'Refresh alone does not retry latched matching failure');
  await button('Retry'); await ready();
  check(await evaluate('__held48.active()===-1 && __held48.count()==="0 of 4 matching records"'), 'Explicit Retry uses current inputs without replaying old reveal');
  await edit('payment'); await ready();
  check(await evaluate('__held48.active()===11'), 'Explicit edit recovers with a new search intent');

  await arm('upstream', 'fail', 'ranges'); await edit('upstream'); await ready();
  await until('__held48.root().textContent.includes("Retry highlights")');
  check(await evaluate('__held48.count()==="1 of 4 matching records" && !__held48.next().disabled'), 'Controlled decoration transport failure preserves exact count/navigation');
  await button('Next match'); await button('Search history');
  check(await evaluate('[...document.querySelectorAll(".rl-history-text")].some(e=>e.textContent==="upstream")'), 'Failed decoration does not block valid explicit-navigation history');
  result.transportCalls = await d.main.evaluate('__held48.calls'); result.pass = true;
} catch (error) { result.error = error.stack; process.exitCode = 1; }
finally {
  await d.main.evaluate(`(()=>{const s=global.__held48;if(s){s.release(false);process.mainModule.require('electron').ipcMain._invokeHandlers.set(s.channel,s.original);delete global.__held48}return true})()`).catch(() => {});
  await evaluate("LensExtensions.Renderer.Navigation.navigate('/overview');delete globalThis.__held48;true").catch(() => {});
  result.closed = await d.wait(s => !s.live && !s.service.owners && !s.service.retiring).catch(() => null);
  report('held-replies', result); console.log(JSON.stringify({ pass: result.pass, error: result.error, checks: result.checks.length })); d.close();
}
