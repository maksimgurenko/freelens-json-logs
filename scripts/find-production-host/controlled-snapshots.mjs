// Controlled HTTP response bodies/delivery at the real host SDK boundary.
// The installed production adapter/session/renderer and main worker stay intact.
// These are not naturally occurring duplicate Kubernetes timestamps or restarts.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { driver, report, sleep } from './driver.mjs';
import { privateSession } from './private-session.mjs';
import { evidence } from './config.mjs';

const d = await driver(), result = { session: privateSession(), checks: [],
  scope: 'Actual installed adapter/session/viewer/worker with controlled target-scoped HTTP bodies/delivery and SDK delivery. Not real kubelet ordering, physical input, clipboard or native focus.' };
const fixture = JSON.parse(readFileSync(`${evidence}/fixture.json`));
const evaluate = code => d.page.evaluate(code, d.cluster());
const check = (value, label) => { assert(value, label); result.checks.push(label); };
const until = async code => {
  for (let i = 0; i < 500; i++) { if (await evaluate(code)) return; await sleep(10); }
  throw Error('Controlled host condition not settled: ' + code);
};
const button = name => evaluate(`__controlled48.button(${JSON.stringify(name)})`);
const query = async text => { await evaluate(`__controlled48.edit(${JSON.stringify(text)})`); await until('__controlled48.count()?.includes("matching records")'); };
const raw = lines => lines.map(line => `2026-10-27T00:00:00.000000000Z ${line}`).join('\n') + '\n';
const logs = lines => evaluate(`__http48.logs=${JSON.stringify(raw(lines))};true`);
const status = value => evaluate(`__http48.status=${JSON.stringify(value)};__http48.metadataCount`);
const observe = async value => {
  const count = await status(value);
  await until(`__http48.metadataCount>${count}`);
};
try {
  await d.bind(d.cluster());
  await evaluate("LensExtensions.Renderer.Navigation.navigate('/overview');true"); await d.wait(s => !s.live && !s.service.owners);
  await evaluate(`(()=>{const p=require('node:http').ClientRequest.prototype;
    if(globalThis.__http48)throw Error('Fresh controlled boundary required');
    const s=globalThis.__http48={prototype:p,descriptor:Object.getOwnPropertyDescriptor(p,'emit'),original:p.emit,
      target:${JSON.stringify(`/api-kube/api/v1/namespaces/${fixture.namespace}/pods/find-fixtures`)},status:null,logs:${JSON.stringify(raw(['start', 'x upstream', 'end']))},metadataCount:0,calls:[],heldMetadata:[],heldLogs:[],holdMetadata:false,holdLogs:false};
    p.emit=function(name,...args){const path=this.path?.split('?')[0],kind=path===s.target?'metadata':path===s.target+'/log'?'logs':null;
      if(name!=='response'||!kind||args[0].statusCode!==200)return s.original.call(this,name,...args);
      const response=args[0],request=this,chunks=[];response.on('data',b=>chunks.push(b));response.on('error',error=>s.original.call(request,'error',error));
      response.on('end',()=>{const body=Buffer.concat(chunks).toString('utf8');const deliver=(fail=false)=>{
        if(fail){s.original.call(request,'error',Error('Controlled old-instance log transport failure'));return}
        let text=s.logs;if(kind==='metadata'){const pod=JSON.parse(body);pod.status.containerStatuses=s.status===null?[]:[{...pod.status.containerStatuses[0],name:'traces',restartCount:s.status.count,containerID:s.status.id}];text=JSON.stringify(pod);s.metadataCount++}
        s.calls.push({kind,metadataCount:s.metadataCount,status:s.status,units:text.length});
        const reply=new (require('node:stream').PassThrough)();Object.assign(reply,{statusCode:response.statusCode,statusMessage:response.statusMessage,httpVersion:response.httpVersion,headers:{...response.headers},url:response.url});delete reply.headers['content-length'];delete reply.headers['transfer-encoding'];
        s.original.call(request,'response',reply);reply.end(text);
      };if(kind==='metadata'&&s.holdMetadata){s.holdMetadata=false;s.heldMetadata.push(deliver)}else if(kind==='logs'&&s.holdLogs){s.holdLogs=false;s.heldLogs.push(deliver)}else deliver()});return true};return true})()`);
  const clusterId = await evaluate('LensExtensions.Renderer.Catalog.getActiveCluster().id');
  await evaluate(`__findRenderer.navigate('readable-logs',${JSON.stringify({ namespace: fixture.namespace, pod: 'find-fixtures', podUid: fixture.podUid, clusterId })});true`);
  await until('document.querySelectorAll(".rl-record").length===3');
  await evaluate(`globalThis.__controlled48={rows:()=>[...document.querySelectorAll('.rl-record')],input:()=>document.querySelector('#rl-find'),count:()=>document.querySelector('.rl-find-count')?.textContent,
    active:()=>Number(document.querySelector('.rl-find-current')?.dataset.recordIndex??-1),
    button(name){const b=[...document.querySelector('.readable-logs').querySelectorAll('button')].find(b=>b.getAttribute('aria-label')===name||b.textContent.trim()===name);if(!b||b.disabled)throw Error('Missing enabled '+name);b.click()},
    edit(text){const e=this.input();e.setSelectionRange(0,e.value.length);e.dispatchEvent(new InputEvent('beforeinput',{bubbles:true,inputType:'insertFromPaste',data:text}));Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,text);e.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertFromPaste',data:text}))}};true`);
  await button('Pause'); await button('Find');
  await evaluate(`(()=>{const h=__controlled48;h.rows()[1].querySelector('.rl-row').click();h.row=h.rows()[1];h.node=h.row.querySelector('[data-source-start]').firstChild;const range=document.createRange();range.selectNodeContents(h.row.querySelector('.rl-message'));getSelection().removeAllRanges();getSelection().addRange(range);h.selection=getSelection().toString();return true})()`);
  await query('upstream');
  await evaluate(`(()=>{const h=__controlled48,range=document.createRange();range.selectNodeContents(h.row.querySelector('.rl-message'));getSelection().removeAllRanges();getSelection().addRange(range);h.selection=getSelection().toString();return true})()`);
  check(await evaluate('getSelection().toString()==="x upstream"'), 'Duplicate selection precondition is established after editing input');
  await logs(['x upstream', 'end', 'x upstream']); await button('Refresh');
  await until('__controlled48.count()==="1 of 2 matching records"');
  check(await evaluate('__controlled48.rows()[0]===__controlled48.row && document.querySelector(".rl-selected")===__controlled48.row && __controlled48.active()===0'), 'Trace 8 identical complete transport-line overlap maps old x to row 0, never appended x at row 2');
  check(await evaluate('__controlled48.rows()[0].querySelector("[data-source-start]").firstChild===__controlled48.node && getSelection().toString()===__controlled48.selection'), 'Controlled duplicate window preserves original source node and DOM selection');
  await button('Refresh'); await until('document.querySelector(".rl-records").getAttribute("aria-busy")==="false" && __controlled48.count()==="1 of 2 matching records"');
  check(await evaluate('__controlled48.rows()[0]===__controlled48.row && __controlled48.active()===0'), 'Identical whole transport windows retain observed occurrence/DOM identity');
  await button('Clear Find'); await query('upstream');
  check(await evaluate('__controlled48.active()===0'), 'Independent reading row uses the same surviving duplicate occurrence');
  await logs(['new upstream']); await button('Refresh'); await until('__controlled48.count()==="0 of 1 matching records"');
  check(await evaluate('!__controlled48.row.isConnected && !document.querySelector(".rl-detail") && __controlled48.active()===-1'), 'Zero-overlap controlled window expires inspector/reading/Find references without text or index recovery');
  await evaluate('getSelection().removeAllRanges();true'); await query('upstream');
  await observe({ count: 0, id: 'controlled-A' });
  check(await evaluate('__controlled48.input().value==="upstream" && __controlled48.active()===0'), 'First-known count/ID after initially missing status establishes a baseline without reset');
  await observe(null);
  check(await evaluate('__controlled48.input().value==="upstream" && __controlled48.active()===0'), 'Temporarily missing status does not reset Find');
  await observe({ count: 1 });
  await until('__controlled48.input().value==="" && __controlled48.rows().length===0');
  check(await evaluate('document.querySelector(".rl-update-status").textContent==="Paused"'), 'Count-only instance change resets Find/window while preserving Pause');
  await button('Refresh'); await until('__controlled48.rows().length===1'); await query('upstream');
  await observe({ count: 1, id: 'controlled-B' });
  check(await evaluate('__controlled48.input().value==="upstream" && __controlled48.active()===0'), 'First ID following a count-only restart does not reset a second time');
  await observe({ count: 1, id: 'controlled-C' });
  await until('__controlled48.input().value==="" && __controlled48.rows().length===0');
  check(true, 'Differing known IDs identify a restart even when the known count stays equal');
  await button('Refresh'); await until('__controlled48.rows().length===1'); await query('upstream');

  await d.main.evaluate(`(()=>{const ipc=process.mainModule.require('electron').ipcMain,channel=[...ipc._invokeHandlers.keys()].find(x=>x.endsWith(':find-request')),original=ipc._invokeHandlers.get(channel);
    const s=global.__controlled48={channel,original,next:false,held:[],keys:[],release(fail){for(const h of this.held.splice(0))fail?h.reject(Error('Controlled old-instance transport error')):h.resolve(h.value)}};
    ipc._invokeHandlers.set(channel,async(event,token,request)=>{if(request.work==='match')s.keys.push(request.key);const hold=s.next&&request.work==='match';if(hold)s.next=false;const value=await original(event,token,request);return hold?new Promise((resolve,reject)=>s.held.push({resolve,reject,value,key:request.key})):value});return true})()`);
  for (const fail of [false, true]) {
    await evaluate('__http48.holdMetadata=true;true'); await until('__http48.heldMetadata.length===1');
    await d.main.evaluate('__controlled48.next=true;true'); await evaluate('__controlled48.edit("upstream");true');
    for (let i = 0; i < 150; i++) { if (await d.main.evaluate('__controlled48.held.length===1')) break; assert(i < 149); await sleep(5); }
    const key = await d.main.evaluate('__controlled48.held[0].key');
    check(await evaluate(`document.querySelector('[aria-label="Next match"]').disabled && ['Matching pending','Searching…'].includes(__controlled48.count())`), 'Old-instance reply is still pending before the controlled instance observation');
    await status({ count: fail ? 3 : 2 });
    await evaluate('__http48.heldMetadata.shift()();true');
    await until('__controlled48.input().value==="" && __controlled48.rows().length===0');
    await d.main.evaluate(`__controlled48.release(${fail});true`); await sleep(30);
    const delivered = await evaluate(`({query:__controlled48.input().value,rows:__controlled48.rows().length,active:__controlled48.active(),count:__controlled48.count(),retry:[...document.querySelectorAll('.readable-logs button')].some(b=>b.textContent.trim()==='Retry')})`);
    assert.deepEqual(delivered, { query: '', rows: 0, active: -1, count: 'Enter text to find', retry: false });
    check(true, `Held old-instance ${fail ? 'injected failure' : 'actual success'} cannot repopulate or latch an error in reset Find`);
    await button('Refresh'); await until('__controlled48.rows().length===1'); await query('upstream');
    const currentKey = await d.main.evaluate('__controlled48.keys.at(-1)');
    check(currentKey.instanceEpoch > key.instanceEpoch, 'New successful evaluation has a strictly newer instance epoch');
    result.instanceDeliveries ??= []; result.instanceDeliveries.push({ key, currentKey, fail, delivered });
  }
  for (const fail of [false, true]) {
    await evaluate('__http48.holdMetadata=true;true'); await until('__http48.heldMetadata.length===1');
    await evaluate('__http48.holdLogs=true;true'); await button('Refresh'); await until('__http48.heldLogs.length===1');
    await status({ count: fail ? 5 : 4 }); await evaluate('__http48.heldMetadata.shift()();true');
    await until('__controlled48.rows().length===0 && __controlled48.input().value===""');
    await evaluate(`__http48.heldLogs.shift()(${fail});true`); await sleep(30);
    check(await evaluate('__controlled48.rows().length===0 && document.querySelector(".rl-update-status").textContent==="Paused" && !document.querySelector(".rl-error")'), `Late old-instance snapshot ${fail ? 'injected transport failure' : 'actual completion'} cannot replace or repopulate the cleared paused window`);
    await button('Refresh'); await until('__controlled48.rows().length===1'); await query('upstream');
  }
  result.boundaryCalls = await evaluate('__http48.calls');
  result.pass = true;
} catch (error) { result.error = error.stack; process.exitCode = 1; }
finally {
  await d.main.evaluate(`(()=>{const s=global.__controlled48;if(s){s.release(false);process.mainModule.require('electron').ipcMain._invokeHandlers.set(s.channel,s.original);delete global.__controlled48}return true})()`).catch(() => {});
  await evaluate(`(()=>{const s=globalThis.__http48;if(s){s.heldMetadata.splice(0).forEach(f=>f());s.heldLogs.splice(0).forEach(f=>f());if(s.descriptor)Object.defineProperty(s.prototype,'emit',s.descriptor);else delete s.prototype.emit;delete globalThis.__http48}LensExtensions.Renderer.Navigation.navigate('/overview');delete globalThis.__controlled48;return true})()`).catch(() => {});
  result.closed = await d.wait(s => !s.live && !s.service.owners && !s.service.retiring).catch(() => null);
  report('controlled-snapshots', result); console.log(JSON.stringify({ pass: result.pass, error: result.error, checks: result.checks.length })); d.close();
}
