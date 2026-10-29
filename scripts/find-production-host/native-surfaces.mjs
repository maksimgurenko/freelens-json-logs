import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { driver, report, sleep } from './driver.mjs';
import { isolatedInput, native } from './native-input.mjs';
const d=await driver(),result={physicalHardware:false,checks:[],route:'private compositor virtual pointer/keyboard; input-method-v2 capability'};
const keyboard=spawn('wtype',['-s','600000'],{env:isolatedInput().env,stdio:'ignore'});
let ime;
const read=x=>d.page.evaluate(x,d.cluster());
const key=(...args)=>native('wtype',['-s','100',...args]);
const state=()=>read(`({query:document.querySelector('#rl-find')?.value,open:!!document.querySelector('#rl-find')?.getClientRects().length,focus:document.hasFocus(),active:Number(document.querySelector('.rl-find-current')?.dataset.recordIndex??-1),selection:getSelection()?.toString(),inspected:Number(document.querySelector('.rl-selected')?.dataset.recordIndex??-1),scroll:document.querySelector('.rl-records')?.scrollTop,events:globalThis.__nativeSurfaceEvents?.slice(-30)})`);
async function until(fn,label){for(let i=0;i<100;i++){const s=await state();if(fn(s))return s;await sleep(20)}throw Error(label+': '+JSON.stringify(await state()))}
async function test(name,fn){const c={name,before:await state()};result.checks.push(c);try{await fn();c.pass=true}catch(e){c.pass=false;c.error=e.stack}c.after=await state();report('native-surfaces',result);console.log(JSON.stringify({name,pass:c.pass,error:c.error?.split('\n')[0]}))}
async function point(rect){const {session}=isolatedInput();const w=JSON.parse(native('hyprctl',['clients','-j'])).find(c=>c.pid===session.pid);assert(w?.mapped);const frame=await d.page.evaluate(`document.querySelector('iframe').getBoundingClientRect().toJSON()`,d.root());return [w.at[0]+frame.x+rect.x,w.at[1]+frame.y+rect.y]}
async function click(selector){const r=await read(`document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect().toJSON()`);assert(r.width&&r.height);const p=await point({x:r.x+r.width/2,y:r.y+r.height/2});native('.scratch/find/48-host/native-pointer',['click',...p.map(x=>String(Math.round(x)))]);await sleep(120)}
try{
 await sleep(300);
 await read(`(()=>{globalThis.__nativeSurfaceEvents=[];globalThis.__nativeSurfaceRemove=[];for(const n of ['pointerdown','pointerup','wheel','compositionstart','compositionupdate','compositionend','input','keydown']){const f=e=>__nativeSurfaceEvents.push({type:e.type,trusted:e.isTrusted,key:e.key,data:e.data,composing:e.isComposing,inputType:e.inputType,target:e.target?.id||e.target?.className});document.addEventListener(n,f,true);__nativeSurfaceRemove.push(()=>document.removeEventListener(n,f,true))}return true})()`);
 await test('Private protocol pointer click, wheel and source drag/copy',async()=>{
   await click('[aria-label="Clear Find"]');await until(s=>s.query==='','Pointer clear');
   await click('[aria-label="Close Find"]');await until(s=>!s.open,'Pointer closes Find');
   const s=await read(`document.querySelector('.rl-records').getBoundingClientRect().toJSON()`),p=await point({x:s.x+s.width/2,y:s.y+s.height/2});
   native('.scratch/find/48-host/native-pointer',['scroll',...p.map(x=>String(Math.round(x))),'-200']);await until(s=>s.scroll===0,'Native wheel reaches beginning');
   const rect=await read(`(()=>{const e=document.querySelector('[data-record-index="2"] [data-find-source="message"]');const r=document.createRange();r.selectNodeContents(e);return r.getBoundingClientRect().toJSON()})()`);
   const start=await point({x:rect.x,y:rect.y+rect.height/2}),end=await point({x:rect.right,y:rect.y+rect.height/2});
   native('.scratch/find/48-host/native-pointer',['drag',...start.concat(end).map(x=>String(Math.round(x)))]);
   const current=await until(s=>s.selection==='row 2 upstream','Native drag selects exact source');assert.equal(current.inspected,-1);
   key('-M','ctrl','-k','c','-m','ctrl');await sleep(100);assert.equal(native('wl-paste',['--no-newline']),'row 2 upstream');
   key('-M','ctrl','-k','f','-m','ctrl');await until(s=>s.open&&s.query==='row 2 upstream','Selected text seeds Find');
   assert((await state()).events.some(e=>e.type==='pointerdown'&&e.trusted));
 });
 await test('Genuine input-method-v2 preedit/commit if supported by this host',async()=>{
   // Only the existing input is used; no flag changes or host restart to add IME.
   const before=await state();assert(before.focus&&before.open,'Focused Find required');
   ime=spawn('.scratch/find/48-host/native-ime',[],{env:isolatedInput().env,stdio:['pipe','pipe','pipe']});
   result.ime={pid:ime.pid,environment:isolatedInput().env,stdout:'',stderr:''};
   ime.stdout.on('data',b=>result.ime.stdout+=b);ime.stderr.on('data',b=>result.ime.stderr+=b);
   await sleep(200);key('-k','Tab');key('-M','shift','-k','Tab','-m','shift');await sleep(200);
   ime.stdin.write('S\n');await sleep(100);
   assert(result.ime.stdout.includes('"active":true'),'Compositor IME registered but no active host text-input session');
   key('-M','ctrl','-k','a','-m','ctrl');ime.stdin.write('P\n');await sleep(200);
   const composing=await state();assert(composing.events.some(e=>e.type==='compositionstart'&&e.trusted),'No genuine composition start');
   ime.stdin.write('C\n');await until(s=>s.query==='あ','Native IME commit');
   result.ime.events=await read('globalThis.__nativeSurfaceEvents.filter(e=>e.type.startsWith("composition"))');
   assert(result.ime.events.some(e=>e.type==='compositionend'&&e.trusted));
 });
 result.events=await read('globalThis.__nativeSurfaceEvents');
}finally{
 if(ime){ime.stdin.end('Q\n');await sleep(100);if(ime.exitCode===null)ime.kill();result.ime.exit=ime.exitCode}
 await read('(()=>{for(const f of globalThis.__nativeSurfaceRemove??[])f();delete globalThis.__nativeSurfaceRemove;return true})()');
 keyboard.kill();result.final=await state();report('native-surfaces',result);d.close();
}
