// Final non-resource #48 cases at the installed viewer / SDK seams.
// Controlled response delivery and DOM row intent do not prove native input.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { driver, report, sleep } from './driver.mjs';
import { privateSession } from './private-session.mjs';
import { evidence } from './config.mjs';

const d = await driver(), result = { session: privateSession(), checks: [], deliveries: [], pass: false,
  scope: 'Actual installed production viewer/session/adapter/SDK/worker. Target-scoped controlled HTTP bodies for eviction; held actual worker replies or injected transport failures for replacement. DOM input/focusin only; no native input, clipboard, focus spoofing, resource attribution or soak.' };
const fixture = JSON.parse(readFileSync(`${evidence}/fixture.json`));
const evaluate = code => d.page.evaluate(code, d.cluster());
const check = (value, label) => { assert(value, label); result.checks.push(label); };
const until = async code => {
  for (let i = 0; i < 400; i++) { if (await evaluate(code)) return; await sleep(10); }
  throw Error('Context boundary did not settle: ' + code);
};
const button = name => evaluate(`__context48.button(${JSON.stringify(name)})`);
const query = async text => {
  await evaluate(`__context48.edit(${JSON.stringify(text)})`);
  await until('__context48.count()?.includes("matching records")');
};
const snapshot = () => evaluate(`({query:__context48.input().value,count:__context48.count(),active:__context48.active(),
  rows:__context48.rows().length,top:document.querySelector('.rl-records').scrollTop,
  inspected:document.querySelector('.rl-selected')?.dataset.recordIndex??null,
  paused:document.querySelector('.rl-update-status').textContent,
  retry:[...document.querySelectorAll('.readable-logs button')].some(b=>b.textContent.trim()==='Retry'),
  flags:['Match case','Whole words'].map(n=>document.querySelector('[aria-label="'+n+'"]').getAttribute('aria-pressed'))})`);
const frames = () => evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
const raw = lines => lines.map(line => '2026-10-27T00:00:00.000000000Z ' + line + '\n').join('');
let clusterId, params;
const navigate = async (target, rows) => {
  await evaluate(`__findRenderer.navigate('readable-logs',${JSON.stringify(target)});true`);
  await until(`document.querySelectorAll('.rl-record').length===${rows} && !document.querySelector('.rl-records[aria-busy=true]')`);
};
const restoreHttp = () => evaluate(`(()=>{const s=globalThis.__contextHttp48;if(!s)return true;
  if(s.p.emit!==s.wrapper)throw Error('HTTP boundary changed before restoration');
  if(s.descriptor)Object.defineProperty(s.p,'emit',s.descriptor);else delete s.p.emit;
  if(s.p.emit!==s.original)throw Error('HTTP restoration failed');delete globalThis.__contextHttp48;return true})()`);

try {
  await d.bind(d.cluster());
  await evaluate("LensExtensions.Renderer.Navigation.navigate('/overview');true");
  await d.wait(s => !s.live && !s.service.owners);
  clusterId = await evaluate('LensExtensions.Renderer.Catalog.getActiveCluster().id');
  params = { namespace: fixture.namespace, pod: 'find-fixtures', podUid: fixture.podUid, clusterId };
  await evaluate(`globalThis.__context48={rows:()=>[...document.querySelectorAll('.rl-record')],input:()=>document.querySelector('#rl-find'),
    count:()=>document.querySelector('.rl-find-count')?.textContent,active:()=>Number(document.querySelector('.rl-find-current')?.dataset.recordIndex??-1),
    button(name){const b=[...document.querySelectorAll('.readable-logs button')].find(b=>b.getAttribute('aria-label')===name||b.textContent.trim()===name);if(!b||b.disabled)throw Error('Missing enabled '+name);b.click()},
    edit(text){const e=this.input();e.setSelectionRange(0,e.value.length);e.dispatchEvent(new InputEvent('beforeinput',{bubbles:true,inputType:'insertFromPaste',data:text}));Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,text);e.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertFromPaste',data:text}))},
    tab(index){const row=this.rows()[index].querySelector('.rl-row');this.input().dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'Tab'}));row.focus({preventScroll:true});row.dispatchEvent(new FocusEvent('focusin',{bubbles:true}));row.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,key:'Tab'}));}};true`);
  await evaluate(`(()=>{const p=require('node:http').ClientRequest.prototype;
    if(globalThis.__contextHttp48)throw Error('Fresh HTTP boundary required');
    const s=globalThis.__contextHttp48={p,descriptor:Object.getOwnPropertyDescriptor(p,'emit'),original:p.emit,
      path:${JSON.stringify(`/api-kube/api/v1/namespaces/${fixture.namespace}/pods/find-fixtures/log`)},body:${JSON.stringify(raw(['A upstream', 'C upstream', 'B upstream', 'D upstream']))},served:0};
    s.wrapper=function(name,...args){if(name!=='response'||this.path?.split('?')[0]!==s.path||args[0].statusCode!==200)return s.original.call(this,name,...args);
      const response=args[0],request=this;response.on('error',error=>s.original.call(request,'error',error));response.on('end',()=>{
        const reply=new (require('node:stream').PassThrough)();Object.assign(reply,{statusCode:response.statusCode,statusMessage:response.statusMessage,httpVersion:response.httpVersion,headers:{...response.headers},url:response.url});delete reply.headers['content-length'];delete reply.headers['transfer-encoding'];
        s.served++;s.original.call(request,'response',reply);reply.end(s.body)});response.resume();return true};p.emit=s.wrapper;return true})()`);
  await navigate(params, 4); await button('Pause'); await button('Find');
  await evaluate('__context48.rows()[0].querySelector(".rl-row").click();__context48.tab(2);__context48.readingRow=__context48.rows()[2];true');
  check(await evaluate('document.querySelector(".rl-selected").dataset.recordIndex==="0" && __context48.readingRow.querySelector(".rl-message").textContent==="B upstream"'), 'Inspector A and independently DOM-keyboard-chosen reading row B are distinct');
  await query('upstream');
  check(await evaluate('__context48.active()===2 && __context48.count()==="3 of 4 matching records"'), 'Before eviction a new query starts at independent reading row B, not inspected A');
  await button('Clear Find');
  await evaluate(`__contextHttp48.body=${JSON.stringify(raw(['C upstream', 'B upstream', 'D upstream', 'E upstream']))};true`);
  await button('Refresh');
  await until('__context48.rows()[0]?.querySelector(".rl-message").textContent==="C upstream" && !document.querySelector(".rl-records[aria-busy=true]")');
  check(await evaluate('!document.querySelector(".rl-detail") && !document.querySelector(".rl-selected") && __context48.rows()[1]===__context48.readingRow && __context48.input().value===""'), 'Evicting inspected A closes only its inspector and preserves the surviving B occurrence/DOM row');
  await query('upstream');
  result.eviction = await snapshot();
  check(result.eviction.active === 1 && result.eviction.count === '2 of 4 matching records' && result.eviction.inspected === null && result.eviction.paused === 'Paused', 'After A eviction a fresh query starts at B; it skips earlier matching C without reopening inspection');
  await evaluate('delete __context48.readingRow;true');
  result.httpRestored = await restoreHttp();
  await evaluate("LensExtensions.Renderer.Navigation.navigate('/overview');true");
  await d.wait(s => !s.live && !s.service.owners && !s.service.retiring);

  // A second actual target in the owned namespace makes target replacement
  // independently observable. No shared fixture is mutated.
  const kubectl = ['--context', 'kind-freelens-json-logs-spike'];
  const namespace = JSON.parse(execFileSync('kubectl', [...kubectl, 'get', 'ns', fixture.namespace, '-o', 'json'], { encoding: 'utf8' }));
  assert.equal(namespace.metadata.uid, fixture.namespaceUid);
  assert.equal(namespace.metadata.labels['find-verification'], '48');
  const pod = { apiVersion: 'v1', kind: 'Pod', metadata: { generateName: 'find-second-target-', namespace: fixture.namespace, labels: { 'find-verification': '48' } },
    spec: { containers: [{ name: 'traces', image: fixture.image, command: ['sh', '-c', "printf '%s\\n' 'first upstream' 'quiet' 'second upstream'; sleep 86400"] }] } };
  const second = JSON.parse(execFileSync('kubectl', [...kubectl, 'create', '-f', '-', '-o', 'json'], { input: JSON.stringify(pod), encoding: 'utf8' }));
  execFileSync('kubectl', [...kubectl, '-n', fixture.namespace, 'wait', 'pod/' + second.metadata.name, '--for=condition=Ready', '--timeout=60s'], { encoding: 'utf8' });
  const secondParams = { ...params, pod: second.metadata.name, podUid: second.metadata.uid };
  result.targets = { original: params, replacement: secondParams, image: fixture.image };
  await d.main.evaluate(`(()=>{const ipc=process.mainModule.require('electron').ipcMain,channel=[...ipc._invokeHandlers.keys()].find(x=>x.endsWith(':find-request'));
    if(!channel||global.__context48)throw Error('Fresh SDK boundary required');
    const original=ipc._invokeHandlers.get(channel),s=global.__context48={ipc,channel,original,held:[],calls:[],next:false,
      release(fail){for(const h of this.held.splice(0))fail?h.reject(Error('Controlled retired-viewer transport failure')):h.resolve(h.value)}};
    s.wrapper=async(event,token,request)=>{if(request.work==='match')s.calls.push({key:request.key,token});const hold=s.next&&request.work==='match';if(hold)s.next=false;const value=await original(event,token,request);return hold?new Promise((resolve,reject)=>s.held.push({resolve,reject,value,key:request.key,token})):value};
    ipc._invokeHandlers.set(channel,s.wrapper);return true})()`);
  for (const dimension of ['target', 'viewer']) for (const fail of [false, true]) {
    await evaluate("LensExtensions.Renderer.Navigation.navigate('/overview');true");
    await d.wait(s => !s.live && !s.service.owners && !s.service.retiring);
    await navigate(params, 120); await button('Pause'); await button('Find');
    await d.main.evaluate('__context48.next=true;true');
    await evaluate('__context48.edit("upstream");true');
    for (let i = 0; ; i++) { if (await d.main.evaluate('__context48.held.length===1')) break; assert(i < 150, 'Completed real SDK reply not held'); await sleep(5); }
    const held = await d.main.evaluate('({key:__context48.held[0].key,token:__context48.held[0].token,replyKind:__context48.held[0].value.kind,matchingRecords:__context48.held[0].value.records?.length})');
    assert.equal(held.replyKind, 'matches', 'Hold a real successful worker reply, not a failure outcome');
    assert.equal(held.matchingRecords, 4, 'The held original target has four known matching records');
    check(await evaluate(`document.querySelector('[aria-label="Next match"]').disabled && ['Matching pending','Searching…'].includes(__context48.count())`), `Old ${dimension} ${fail ? 'failure' : 'success'} is pending before replacement`);
    if (dimension === 'viewer') {
      await evaluate("LensExtensions.Renderer.Navigation.navigate('/overview');true");
      await d.wait(s => !s.live && !s.service.owners && !s.service.retiring);
    }
    await navigate(dimension === 'target' ? secondParams : params, dimension === 'target' ? 3 : 120);
    check(await evaluate('__context48.input().value==="" && __context48.count()==="Enter text to find"'), `Replacement ${dimension} starts with fresh Find state`);
    await button('Pause'); await button('Find'); await query('upstream');
    await until('[...CSS.highlights].some(([,h])=>h.size>0)'); await frames();
    const current = await d.main.evaluate('__context48.calls.at(-1)');
    assert(current.key.viewerEpoch > held.key.viewerEpoch, 'Replacement must have a newer actual viewer epoch');
    assert.notEqual(current.token, held.token, 'Replacement must have a new main-owned token');
    const before = await snapshot();
    assert.equal(before.count, dimension === 'target' ? '1 of 2 matching records' : '1 of 4 matching records');
    await d.main.evaluate(`__context48.release(${fail});true`); await sleep(80); await frames();
    const after = await snapshot(); assert.deepEqual(after, before, `Retired ${dimension} reply changed the replacement view`);
    result.deliveries.push({ dimension, fail, heldKey: held.key, heldReply: { kind: held.replyKind, matchingRecords: held.matchingRecords }, currentKey: current.key, ownerChanged: current.token !== held.token, before, after });
    check(!after.retry, `Retired ${dimension} ${fail ? 'injected transport failure' : 'actual worker success'} cannot alter new count/result/query/flags/scroll or latch Retry`);
  }
  result.documentHasFocus = await evaluate('document.hasFocus()');
  assert.equal(result.documentHasFocus, false);
  result.pass = true;
} catch (error) { result.error = error.stack; }
finally {
  const cleanup = [
    ['sdkRestored', () => d.main.evaluate(`(()=>{const s=global.__context48;if(!s)return true;s.release(false);
      if(s.ipc._invokeHandlers.get(s.channel)!==s.wrapper)throw Error('SDK boundary changed before restoration');s.ipc._invokeHandlers.set(s.channel,s.original);
      if(s.ipc._invokeHandlers.get(s.channel)!==s.original)throw Error('SDK restoration failed');delete global.__context48;return true})()`)],
    ['httpRestored', restoreHttp],
    ['rendererRestored', () => evaluate("LensExtensions.Renderer.Navigation.navigate('/overview');delete globalThis.__context48;true")],
  ];
  for (const [name, restore] of cleanup) {
    try { result[name] = await restore(); }
    catch (error) { (result.restoreErrors ??= []).push({ name, error: error.stack }); result.pass = false; }
  }
  try { result.closed = await d.wait(s => !s.live && !s.service.owners && !s.service.retiring && !s.service.opening && !s.service.senders && !s.service.watch); }
  catch (error) { result.closeError = error.stack; result.pass = false; }
  if (!result.pass) process.exitCode = 1;
  report('context-boundaries', result); console.log(JSON.stringify({ pass: result.pass, error: result.error, checks: result.checks.length, restoreErrors: result.restoreErrors, closeError: result.closeError })); d.close();
}
