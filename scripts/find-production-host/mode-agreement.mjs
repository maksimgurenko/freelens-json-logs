// D10: actual installed mode-dependent matching, ranges, highlights and marks.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { driver, report, sleep } from './driver.mjs';
import { privateSession } from './private-session.mjs';
import { evidence } from './config.mjs';

const d = await driver(), result = { session: privateSession(), modes: [], pass: false,
  scope: 'Installed production viewer/SDK/worker; controlled target-scoped HTTP text and DOM controls, not native input or resource evidence.' };
const evaluate = code => d.page.evaluate(code, d.cluster());
const until = async code => { for (let i = 0; i < 400; i++) { if (await evaluate(code)) return; await sleep(10); } throw Error('Mode agreement did not settle: ' + code); };
const fixture = JSON.parse(readFileSync(`${evidence}/fixture.json`));
try {
  await d.bind(d.cluster());
  await evaluate("LensExtensions.Renderer.Navigation.navigate('/overview');true");
  await d.wait(s => !s.live && !s.service.owners);
  await evaluate(`(()=>{const p=require('node:http').ClientRequest.prototype;
    const s=global.__modeHttp48={p,descriptor:Object.getOwnPropertyDescriptor(p,'emit'),original:p.emit,path:${JSON.stringify(`/api-kube/api/v1/namespaces/${fixture.namespace}/pods/find-fixtures/log`)}};
    s.wrapper=function(name,...args){if(name!=='response'||this.path?.split('?')[0]!==s.path||args[0].statusCode!==200)return s.original.call(this,name,...args);
      const response=args[0],request=this;response.on('error',e=>s.original.call(request,'error',e));response.on('end',()=>{const reply=new (require('node:stream').PassThrough)();Object.assign(reply,{statusCode:response.statusCode,statusMessage:response.statusMessage,httpVersion:response.httpVersion,headers:{...response.headers},url:response.url});delete reply.headers['content-length'];delete reply.headers['transfer-encoding'];s.original.call(request,'response',reply);reply.end(['UPSTREAM','upstream','xupstreamx','quiet'].map(x=>'2026-10-27T00:00:00.000000000Z '+x+'\\n').join(''))});response.resume();return true};p.emit=s.wrapper;return true})()`);
  const clusterId = await evaluate('LensExtensions.Renderer.Catalog.getActiveCluster().id');
  await evaluate(`__findRenderer.navigate('readable-logs',${JSON.stringify({ namespace: fixture.namespace, pod: 'find-fixtures', podUid: fixture.podUid, clusterId })});true`);
  await until('document.querySelectorAll(".rl-record").length===4 && !document.querySelector(".rl-records[aria-busy=true]")');
  await evaluate(`global.__mode48={button(n){const b=[...document.querySelectorAll('.readable-logs button')].find(x=>x.getAttribute('aria-label')===n||x.textContent.trim()===n);if(!b||b.disabled)throw Error('Missing enabled '+n);b.click()},
    edit(text){const e=document.querySelector('#rl-find');e.setSelectionRange(0,e.value.length);e.dispatchEvent(new InputEvent('beforeinput',{bubbles:true,inputType:'insertFromPaste',data:text}));Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,text);e.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertFromPaste',data:text}))},
    snapshot(){return {count:document.querySelector('.rl-find-count').textContent,flags:['Match case','Whole words'].map(n=>document.querySelector('[aria-label="'+n+'"]').getAttribute('aria-pressed')),
      highlighted:[...new Set([...CSS.highlights].flatMap(([,h])=>[...h].map(r=>Number(r.startContainer.parentElement.closest('.rl-record').dataset.recordIndex))))].sort((a,b)=>a-b),
      texts:[...new Set([...CSS.highlights].flatMap(([,h])=>[...h].map(r=>r.toString())))].sort(),marks:[...document.querySelectorAll('.rl-find-mark')].map(b=>b.getAttribute('aria-label'))}}};
    __mode48.button('Pause');__mode48.button('Find');document.querySelectorAll('.rl-record').forEach(r=>r.style.minHeight='64px');true`);
  await d.main.evaluate(`(()=>{const ipc=process.mainModule.require('electron').ipcMain,channel=[...ipc._invokeHandlers.keys()].find(x=>x.endsWith(':find-request')),original=ipc._invokeHandlers.get(channel);
    const s=global.__mode48={ipc,channel,original,calls:[]};s.wrapper=async(event,token,request)=>{const reply=await original(event,token,request);s.calls.push({work:request.work,key:request.key,query:request.query,kind:reply.kind,indices:(reply.records??reply.ranges??[]).map(r=>request.records.findIndex(x=>x.ref.context===r.ref.context&&x.ref.occurrence===r.ref.occurrence))});return reply};ipc._invokeHandlers.set(channel,s.wrapper);return true})()`);
  for (const [matchCase, wholeWords, expected] of [[false, false, [0, 1, 2]], [true, false, [1, 2]], [false, true, [0, 1]], [true, true, [1]]]) {
    await evaluate(`(()=>{for(const [n,on] of [['Match case',${matchCase}],['Whole words',${wholeWords}]])if((document.querySelector('[aria-label="'+n+'"]').getAttribute('aria-pressed')==='true')!==on)__mode48.button(n);__mode48.edit('upstream');return true})()`);
    await until(`(()=>{const s=__mode48.snapshot();return s.count.endsWith('of ${expected.length} matching records')&&JSON.stringify(s.highlighted)===${JSON.stringify(JSON.stringify(expected))}&&s.marks.length===${expected.length}})()`);
    const observed = await evaluate('__mode48.snapshot()');
    assert.deepEqual(observed.flags, [String(matchCase), String(wholeWords)]);
    assert.deepEqual(observed.highlighted, expected);
    assert.deepEqual(observed.texts, matchCase ? ['upstream'] : ['UPSTREAM', 'upstream']);
    assert.deepEqual(observed.marks, expected.map((_, i) => `Find matching record ${i + 1} of ${expected.length}`));
    const calls = await d.main.evaluate('__mode48.calls');
    const match = calls.findLast(c => c.work === 'match');
    const range = calls.findLast(c => c.work === 'ranges' && c.key.queryRevision === match.key.queryRevision);
    assert.equal(match.kind, 'matches'); assert.equal(range?.kind, 'ranges');
    assert.deepEqual(range.key, match.key); assert.deepEqual(range.query, match.query);
    assert.deepEqual(match.query, { text: 'upstream', matchCase, wholeWords });
    assert.deepEqual(match.indices, expected); assert.deepEqual([...new Set(range.indices)].sort((a, b) => a - b), expected);
    // Mark labels expose ordinals, so activate each to verify actual membership.
    for (let ordinal = 0; ordinal < expected.length; ordinal++) {
      const selected = await evaluate(`(()=>{document.querySelectorAll('.rl-find-mark')[${ordinal}].click();return Number(document.querySelector('.rl-find-current').dataset.recordIndex)})()`);
      assert.equal(selected, expected[ordinal]);
    }
    result.modes.push({ matchCase, wholeWords, expected, observed, match, range, activatedRows: expected });
  }
  assert.equal(await evaluate('document.hasFocus()'), false);
  result.pass = true;
} catch (error) { result.error = error.stack; }
finally {
  for (const [name, restore] of [
    ['sdkRestored', () => d.main.evaluate(`(()=>{const s=global.__mode48;if(s){if(s.ipc._invokeHandlers.get(s.channel)!==s.wrapper)throw Error('SDK boundary changed');s.ipc._invokeHandlers.set(s.channel,s.original);delete global.__mode48}return true})()`)],
    ['httpRestored', () => evaluate(`(()=>{const s=global.__modeHttp48;if(s){if(s.p.emit!==s.wrapper)throw Error('HTTP boundary changed');if(s.descriptor)Object.defineProperty(s.p,'emit',s.descriptor);else delete s.p.emit;if(s.p.emit!==s.original)throw Error('HTTP restoration failed');delete global.__modeHttp48}return true})()`)],
    ['rendererRestored', () => evaluate("LensExtensions.Renderer.Navigation.navigate('/overview');delete global.__mode48;true")],
  ]) { try { result[name] = await restore(); } catch (error) { (result.restoreErrors ??= []).push({ name, error: error.stack }); result.pass = false; } }
  try { result.closed = await d.wait(s => !s.live && !s.service.owners && !s.service.retiring && !s.service.opening && !s.service.senders && !s.service.watch); }
  catch (error) { result.closeError = error.stack; result.pass = false; }
  if (!result.pass) process.exitCode = 1;
  report('mode-agreement', result); console.log(JSON.stringify({ pass: result.pass, modes: result.modes.length, error: result.error, restoreErrors: result.restoreErrors, closeError: result.closeError })); d.close();
}
