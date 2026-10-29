// Controlled response bytes at the installed production adapter seam. This
// verifies retention/rendering/Find, not naturally emitted kubelet byte sizes.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { driver, report, sleep } from './driver.mjs';
import { privateSession } from './private-session.mjs';
import { evidence } from './config.mjs';

const d = await driver(), result = { session: privateSession(), checks: [], pass: false,
  scope: 'Target-scoped controlled HTTP response bytes; real installed adapter, retention, renderer, SDK and worker. DOM Range only, no clipboard/native input.' };
const fixture = JSON.parse(readFileSync(`${evidence}/fixture.json`));
const evaluate = code => d.page.evaluate(code, d.cluster());
const until = async code => { for (let i = 0; i < 800; i++) { if (await evaluate(code)) return; await sleep(10); } throw Error('Retention boundary did not settle: ' + code); };
const check = (value, label) => { assert(value, label); result.checks.push(label); };
const button = name => evaluate(`(()=>{const b=[...document.querySelectorAll('.readable-logs button')].find(b=>b.textContent.trim()===${JSON.stringify(name)}||b.getAttribute('aria-label')===${JSON.stringify(name)});if(!b||b.disabled)throw Error('Missing enabled button');b.click();return true})()`);
try {
  await d.bind(d.cluster());
  await evaluate("LensExtensions.Renderer.Navigation.navigate('/overview');true"); await d.wait(s => !s.live && !s.service.owners);
  await evaluate(`(()=>{const p=require('node:http').ClientRequest.prototype;
    if(global.__retention48)throw Error('Fresh boundary required');
    const s=global.__retention48={p,descriptor:Object.getOwnPropertyDescriptor(p,'emit'),original:p.emit,
      path:${JSON.stringify(`/api-kube/api/v1/namespaces/${fixture.namespace}/pods/find-fixtures/log`)},
      prefix:'2026-10-27T00:00:00.000000000Z ',budget:5242880,served:0,body:'',application:'',
      set(bytes){this.application='x'.repeat(bytes-this.prefix.length-3)+' Q';this.body=this.prefix+this.application+'\\n';if(Buffer.byteLength(this.body)!==bytes)throw Error('Incorrect fixture byte size')},
      hash(text){return require('node:crypto').createHash('sha256').update(text).digest('hex')}};
    s.set(s.budget-1);
    p.emit=function(name,...args){if(name!=='response'||this.path?.split('?')[0]!==s.path||args[0].statusCode!==200)return s.original.call(this,name,...args);
      const response=args[0],request=this;response.resume();response.on('error',e=>s.original.call(request,'error',e));response.on('end',()=>{
        const reply=new (require('node:stream').PassThrough)();Object.assign(reply,{statusCode:response.statusCode,statusMessage:response.statusMessage,httpVersion:response.httpVersion,headers:{...response.headers},url:response.url});delete reply.headers['content-length'];delete reply.headers['transfer-encoding'];
        s.served++;s.original.call(request,'response',reply);reply.end(s.body)});return true};return true})()`);
  const clusterId = await evaluate('LensExtensions.Renderer.Catalog.getActiveCluster().id');
  await evaluate(`__findRenderer.navigate('readable-logs',${JSON.stringify({ namespace: fixture.namespace, pod: 'find-fixtures', podUid: fixture.podUid, clusterId })});true`);
  await until('document.querySelectorAll(".rl-record").length===1 && !document.querySelector(".rl-records[aria-busy=true]")');
  await button('Pause'); await button('Find');
  await evaluate(`(()=>{const e=document.querySelector('#rl-find');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'Q');e.dispatchEvent(new Event('input',{bubbles:true}));return true})()`);
  await until('document.querySelector(".rl-find-count").textContent==="1 of 1 matching records"');
  for (const bytes of [5242879, 5242880]) {
    if (bytes === 5242880) {
      const served = await evaluate(`__retention48.set(${bytes});__retention48.served`); await button('Refresh');
      await until(`__retention48.served>${served} && !document.querySelector('.rl-records[aria-busy=true]') && document.querySelector('.rl-find-count').textContent==='0 of 1 matching records'`);
      await button('Next match');
    }
    const sample = await evaluate(`(()=>{const s=__retention48,source=document.querySelector('.rl-message'),range=document.createRange();range.selectNodeContents(source);getSelection().removeAllRanges();getSelection().addRange(range);const selected=getSelection().toString();const spans=[...source.querySelectorAll('[data-source-start]')];return {bytes:Buffer.byteLength(s.body),units:source.textContent.length,sourceHash:s.hash(source.textContent),expectedHash:s.hash(s.application),selectionHash:s.hash(selected),selectionUnits:selected.length,fragments:spans.length,maxFragment:Math.max(...spans.map(n=>n.textContent.length)),rows:document.querySelectorAll('.rl-record').length,count:document.querySelector('.rl-find-count').textContent,paused:document.querySelector('.rl-update-status').textContent}})()`);
    assert.equal(sample.bytes, bytes); assert.equal(sample.rows, 1); assert.equal(sample.sourceHash, sample.expectedHash); assert.equal(sample.selectionHash, sample.expectedHash);
    assert.equal(sample.selectionUnits, bytes - 32); assert(sample.fragments > 1 && sample.maxFragment <= 8192); assert.equal(sample.count, '1 of 1 matching records'); assert.equal(sample.paused, 'Paused');
    result.samples ??= []; result.samples.push(sample);
    check(true, `${bytes}-byte transport response keeps complete application text, exact full-source DOM selection and one matching record`);
  }
  await evaluate(`(()=>{const root=document.querySelector('.readable-logs');root.querySelector('.rl-display-options').open=true;[...root.querySelectorAll('.rl-display-panel label')].find(e=>e.textContent.includes('Word wrap')).querySelector('input').click();root.querySelector('.rl-display-options').open=false;getSelection().removeAllRanges();return true})()`);
  await button('To bottom');
  await until(`[...CSS.highlights].some(([,h])=>[...h].some(r=>Number(r.startContainer.parentElement.dataset.sourceStart)+r.startOffset===__retention48.application.length-1))`);
  check(true, 'Exact 5 MiB fixture decorates the terminal Q from a late visible source range');
  let served = await evaluate('__retention48.set(5242881);__retention48.served'); await button('Refresh');
  await until(`__retention48.served>${served} && !document.querySelector('.rl-records[aria-busy=true]') && document.querySelectorAll('.rl-record').length===0`);
  result.oversized = await evaluate(`({text:document.querySelector('.rl-notice')?.textContent??document.querySelector('.rl-empty')?.textContent,count:document.querySelector('.rl-find-count').textContent})`);
  assert.equal(result.oversized.text, 'The newest record exceeds the 5 MiB original-text budget. No complete suffix fits.');
  check(true, 'One byte over the limit omits the oversized newest record with explicit feedback');
  served = await evaluate(`(()=>{const s=__retention48;s.set(s.budget);s.body=s.prefix+'older\\n'+s.body;return s.served})()`); await button('Refresh');
  await until(`__retention48.served>${served} && !document.querySelector('.rl-records[aria-busy=true]') && document.querySelectorAll('.rl-record').length===1 && document.querySelector('.rl-find-count').textContent==='0 of 1 matching records'`);
  check(await evaluate('document.querySelector(".rl-message").textContent===__retention48.application'), 'Over-budget response retains the exact 5 MiB newest transport line and omits its older predecessor');
  served = await evaluate(`(()=>{const s=__retention48;s.body=Array.from({length:1001},(_,i)=>s.prefix+'row '+i+' Q\\n').join('');return s.served})()`); await button('Refresh');
  await until(`__retention48.served>${served} && !document.querySelector('.rl-records[aria-busy=true]') && document.querySelectorAll('.rl-record').length===1000 && document.querySelector('.rl-find-count').textContent==='0 of 1000 matching records'`);
  check(await evaluate(`(()=>{const rows=[...document.querySelectorAll('.rl-message')];return rows[0].textContent==='row 1 Q'&&rows.at(-1).textContent==='row 1000 Q'})()`), '1001-line response retains the newest 1000 in order and exact matching counts all of them');
  result.pass = true;
} catch (error) { result.error = error.stack; process.exitCode = 1; }
finally {
  try {
    result.httpRestored = await evaluate(`(()=>{try{getSelection().removeAllRanges();LensExtensions.Renderer.Navigation.navigate('/overview')}finally{const s=global.__retention48;if(s){if(s.descriptor)Object.defineProperty(s.p,'emit',s.descriptor);else delete s.p.emit;if(s.p.emit!==s.original)throw Error('HTTP response boundary restoration failed');delete global.__retention48}}return !global.__retention48})()`);
    assert.equal(result.httpRestored, true);
  } catch (error) { result.restoreError = error.stack; result.pass = false; }
  try {
    result.closed = await d.wait(s => !s.live && !s.service.owners && !s.service.retiring && !s.service.opening && !s.service.senders && !s.service.watch);
  } catch (error) { result.closeError = error.stack; result.pass = false; }
  if (!result.pass) process.exitCode = 1;
  report('retention-boundary', result); console.log(JSON.stringify({ pass: result.pass, error: result.error, checks: result.checks.length })); d.close();
}
