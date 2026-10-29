// Actual packed viewer/SDK/worker with real snapshots and saved profiles.
// Controlled SDK delivery and DOM input are labelled separately from native input.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { driver, report, sleep } from './driver.mjs';
import { privateSession } from './private-session.mjs';
import { evidence } from './config.mjs';

const d = await driver(), result = { session: privateSession(), checks: [], deliveries: [],
  scope: 'Installed packed renderer, real Kubernetes snapshots/profiles and held real SDK replies. DOM focus/events only; no native input, clipboard or fake document focus.' };
const evaluate = code => d.page.evaluate(code, d.cluster());
const check = (value, label) => { assert(value, label); result.checks.push(label); };
const until = async (code, label = code) => {
  for (let i = 0; i < 400; i++) { if (await evaluate(code)) return; await sleep(10); }
  throw Error(label + ': ' + await evaluate('document.querySelector(".readable-logs")?.innerText.slice(-1000)'));
};
const button = name => evaluate(`__boundary48.button(${JSON.stringify(name)})`);
const edit = text => evaluate(`__boundary48.edit(${JSON.stringify(text)})`);
const ready = () => until('__boundary48.count()?.includes("matching records")');
const query = async text => { await edit(text); await ready(); };
const selectProfile = async value => {
  await evaluate(`(()=>{const e=document.querySelector('[aria-label="Profile"]');e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
  await ready();
};
const arm = text => d.main.evaluate(`__boundary48.next=${JSON.stringify(text)};true`);
const captured = async () => {
  for (let i = 0; i < 150; i++) { if (await d.main.evaluate('__boundary48.held.length===1')) return; await sleep(5); }
  throw Error('Real completed SDK reply not held');
};
const release = fail => d.main.evaluate(`__boundary48.release(${!!fail});true`);
try {
  await d.bind(d.cluster());
  await evaluate("LensExtensions.Renderer.Navigation.navigate('/overview');true");
  await d.wait(s => !s.live && !s.service.owners);
  const fixture = JSON.parse(readFileSync(`${evidence}/fixture.json`));
  const clusterId = await evaluate('LensExtensions.Renderer.Catalog.getActiveCluster().id');
  await evaluate(`__findRenderer.navigate('readable-logs',${JSON.stringify({ namespace: fixture.namespace, pod: 'find-fixtures', podUid: fixture.podUid, clusterId })});true`);
  await until('document.querySelectorAll(".rl-record").length===120');
  // Unfocused documents can change activeElement without emitting focusin.
  // Deliver that DOM boundary explicitly; do not simulate document.hasFocus.
  await evaluate(`globalThis.__boundary48={root:()=>document.querySelector('.readable-logs'),rows:()=>[...document.querySelectorAll('.rl-record')],input:()=>document.querySelector('#rl-find'),count:()=>document.querySelector('.rl-find-count')?.textContent,
    active:()=>Number(document.querySelector('.rl-find-current')?.dataset.recordIndex??-1),
    button(name){const b=[...this.root().querySelectorAll('button')].find(b=>b.getAttribute('aria-label')===name||b.textContent.trim()===name);if(!b||b.disabled)throw Error('Missing enabled '+name);b.click()},
    edit(text){const e=this.input();e.setSelectionRange(0,e.value.length);e.dispatchEvent(new InputEvent('beforeinput',{bubbles:true,inputType:'insertFromPaste',data:text}));Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,text);e.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertFromPaste',data:text}))},
    tab(index){const row=this.rows()[index].querySelector('.rl-row');this.input().dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'Tab'}));row.focus({preventScroll:true});row.dispatchEvent(new FocusEvent('focusin',{bubbles:true}));row.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,key:'Tab'}));}};true`);
  await button('Pause'); await button('Find');
  await evaluate('__boundary48.rows()[64].querySelector(".rl-row").click();true');
  await query('upstream'); await button('Next match');
  check(await evaluate('__boundary48.active()===82 && !!document.querySelector(".rl-detail")'), 'Trace 1 current packed query from reading row 64 reaches 73 then 82');
  await evaluate('__boundary48.tab(90);true');
  result.tab = await evaluate('({active:__boundary48.active(),count:__boundary48.count(),selected:document.querySelector(".rl-selected")?.outerHTML.slice(0,350),focus:document.activeElement?.outerHTML.slice(0,350)})');
  check(await evaluate('__boundary48.active()===-1 && __boundary48.count()==="0 of 4 matching records" && document.querySelector(".rl-selected").dataset.recordIndex==="64"'), 'Trace 3 DOM Tab intent focuses reading row 90 without changing inspector 64 or count');
  await button('Close record inspector'); await button('Next match');
  check(await evaluate('__boundary48.active()===90 && !document.querySelector(".rl-detail")'), 'Trace 4 closing inspector A preserves independently keyboard-chosen reading row B');
  await button('Clear Find'); await query('needle');
  await evaluate('document.querySelector(".rl-match-hint").click();true');
  check(await evaluate('__boundary48.active()===10 && document.querySelector(".rl-selected").dataset.recordIndex==="10"'), 'Hidden-source inspection addresses source without choosing a new reading row');
  await button('Close record inspector'); await button('Clear Find'); await query('upstream');
  check(await evaluate('__boundary48.active()===90'), 'Hidden-source action and programmatic inspector focus return preserve the independent reading row');

  // Save through production controls, then hold only SDK response delivery.
  const profileName = `Find48 boundary ${fixture.podUid}`;
  await button('Edit profiles'); await button('Duplicate');
  await evaluate(`(()=>{for(const [name,value] of [['Profile name',${JSON.stringify(profileName)}],['Message paths','/absent']]){const e=document.querySelector('[aria-label="'+name+'"]');Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}))}return true})()`);
  await button('Save profile'); await button('Back to logs');
  const profileId = await evaluate(`[...document.querySelector('[aria-label="Profile"]').options].find(o=>o.text===${JSON.stringify(profileName)}).value`);
  await selectProfile(profileId);
  check(await evaluate('__boundary48.active()===90 && __boundary48.count()==="4 of 4 matching records"'), 'Trace 9 saved extraction change retains a still-matching candidate without choosing another hit');
  await selectProfile('default');

  await d.main.evaluate(`(()=>{const ipc=process.mainModule.require('electron').ipcMain,channel=[...ipc._invokeHandlers.keys()].find(x=>x.endsWith(':find-request'));
    if(!channel||global.__boundary48)throw Error('Fresh SDK delivery gate required');
    const original=ipc._invokeHandlers.get(channel),state=global.__boundary48={original,channel,held:[],calls:[],next:undefined,
      release(fail){for(const h of this.held.splice(0))fail?h.reject(Error('Controlled stale transport failure')):h.resolve(h.value)}};
    ipc._invokeHandlers.set(channel,async(event,token,request)=>{state.calls.push({work:request.work,text:request.query.text,key:request.key});const hold=state.next===request.query.text&&request.work==='match';if(hold)state.next=undefined;const value=await original(event,token,request);return hold?new Promise((resolve,reject)=>state.held.push({resolve,reject,value,key:request.key})):value});return true})()`);

  // One fresh logical attempt per stale-dimension/delivery kind; no timer changes.
  for (const dimension of ['windowRevision', 'messageRevision']) {
    for (const fail of [false, true]) {
      await selectProfile('default'); await arm('upstream'); await edit('upstream'); await captured();
      const heldKey = await d.main.evaluate('__boundary48.held[0].key');
      if (dimension === 'windowRevision') {
        // Append only to this newly owned namespace/pod. Real transport timestamps
        // intentionally remain in the response; this is not a duplicate-line test.
        execFileSync('kubectl', ['--context', 'kind-freelens-json-logs-spike', '-n', fixture.namespace, 'exec', 'find-fixtures', '-c', 'traces', '--',
          'sh', '-c', 'printf "%s\\n" \'{"message":"new upstream"}\' > /proc/1/fd/1'], { encoding: 'utf8' });
        await button('Refresh');
      } else await selectProfile(profileId);
      await ready();
      const currentKey = await d.main.evaluate('__boundary48.calls.filter(x=>x.work==="match").at(-1).key');
      check(currentKey[dimension] > heldKey[dimension], `Held ${dimension} ${fail ? 'failure' : 'success'} has a proven superseded key`);
      const before = await evaluate('({count:__boundary48.count(),active:__boundary48.active(),top:document.querySelector(".rl-records").scrollTop,query:__boundary48.input().value})');
      await release(fail); await sleep(40);
      const after = await evaluate('({count:__boundary48.count(),active:__boundary48.active(),top:document.querySelector(".rl-records").scrollTop,query:__boundary48.input().value})');
      assert.deepEqual(after, before, `Stale ${dimension} delivery changed live state`);
      check(await evaluate('!__boundary48.root().textContent.includes("Search failed") && !__boundary48.root().textContent.includes("timed out")'), `Trace 6 stale ${dimension} ${fail ? 'injected transport failure' : 'actual success'} cannot replace current result, count or scroll`);
      result.deliveries.push({ dimension, fail, heldKey, currentKey, before, after });
    }
  }
  await selectProfile('default'); await arm('payment'); await edit('payment'); await captured();
  await button('Edit profiles'); await release(false); await sleep(30); await button('Back to logs'); await ready();
  check(await evaluate('__boundary48.active()===-1 && __boundary48.count()==="0 of 1 matching records"'), 'Trace 7 Profiles cancels held selection/reveal; returning keeps useful count without an old jump');
  await button('Next match');
  check(await evaluate('__boundary48.active()===11'), 'Fresh explicit navigation after Profiles obtains a new reveal permission');

  // Exact seven-entry memory-only history, driven through the actual controls.
  await button('Search history'); await button('Clear history');
  check(await evaluate('document.querySelector(".rl-history-popover").textContent.includes("No recent searches")'), 'Clear history exposes the useful empty state and preserves current query');
  await button('Close search history');
  for (let i = 0; i < 8; i++) { await query(`absent-${i}`); await button('Close Find'); await button('Find'); }
  await button('Search history');
  result.history = await evaluate('[...document.querySelectorAll(".rl-history-text")].map(e=>e.textContent)');
  assert.deepEqual(result.history, Array.from({ length: 7 }, (_, i) => `absent-${7 - i}`));
  check(true, 'History keeps exactly seven valid zero-hit tuples in MRU order');
  await button('Close search history'); await query('absent-7'); await button('Match case'); await ready();
  await button('Close Find'); await button('Find'); await button('Search history');
  check(await evaluate('[...document.querySelectorAll(".rl-history-text")].filter(e=>e.textContent==="absent-7").length===2'), 'History distinguishes exact same-text tuples with different matching flags');
  await button('Close search history'); await button('Clear Find'); await button('Whole words');
  await button('Close Find');
  await evaluate(`(()=>{const r=document.createRange();r.selectNodeContents(__boundary48.rows()[2].querySelector('.rl-message'));getSelection().removeAllRanges();getSelection().addRange(r);return true})()`);
  await button('Find'); await ready();
  check(await evaluate('__boundary48.input().value==="row 2 upstream" && ["Match case","Whole words"].every(n=>document.querySelector(`[aria-label="${n}"]`).getAttribute("aria-pressed")==="true")'), 'Valid empty-input source seed preserves both matching flags');
  await evaluate('getSelection().removeAllRanges();true');
  result.documentHasFocus = await evaluate('document.hasFocus()');
  assert.equal(result.documentHasFocus, false);
  result.unverified = ['Real Tab/keyboard delivery', 'Focus-dependent Escape/shortcut/foreign-editor ownership', 'Native clipboard, editing, IME/AltGraph', 'Exact identical transport-line windows', 'Partial metadata and old-instance SDK delivery'];
  result.pass = true;
} catch (error) { result.error = error.stack; process.exitCode = 1; }
finally {
  await d.main.evaluate(`(()=>{const s=global.__boundary48;if(s){s.release(false);process.mainModule.require('electron').ipcMain._invokeHandlers.set(s.channel,s.original);delete global.__boundary48}return true})()`).catch(() => {});
  await evaluate("LensExtensions.Renderer.Navigation.navigate('/overview');delete globalThis.__boundary48;true").catch(() => {});
  result.closed = await d.wait(s => !s.live && !s.service.owners && !s.service.retiring).catch(() => null);
  report('state-boundaries', result); console.log(JSON.stringify({ pass: result.pass, error: result.error, checks: result.checks.length })); d.close();
}
