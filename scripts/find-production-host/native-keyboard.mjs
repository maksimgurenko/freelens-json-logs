// Independent keyboard route after pointer setup failed. No pointer dependency,
// no DOM input dispatch, no hardware claim and no automatic test reruns.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { driver, report, sleep } from './driver.mjs';
import { isolatedInput, native, clipboard } from './native-input.mjs';
const d=await driver(), result={route:'wtype zwp_virtual_keyboard_v1 on private socket; native Tab focus',physicalHardware:false,checks:[]};
const keep=spawn('wtype',['-s','900000'],{env:isolatedInput().env,stdio:'ignore'}),owners=[];
result.seat={pid:keep.pid,environment:isolatedInput().env};
const read=x=>d.page.evaluate(x,d.cluster());
const key=(...args)=>native('wtype',['-s','100',...args]);
const ctrl=k=>key('-M','ctrl','-k',k,'-m','ctrl');
const state=()=>read(`(()=>{const q=document.querySelector('#rl-find');return {query:q?.value,open:!!q?.getClientRects().length,focus:document.hasFocus(),active:Number(document.querySelector('.rl-find-current')?.dataset.recordIndex??-1),count:document.querySelector('.rl-find-count')?.textContent,selection:q?[q.selectionStart,q.selectionEnd]:null,focused:document.activeElement?.outerHTML.slice(0,250),history:!!document.querySelector('.rl-history-popover'),events:globalThis.__nativeKeyboardEvents?.slice(-30)}})()`);
async function until(test,label){for(let i=0;i<100;i++){const s=await state();if(test(s))return s;await sleep(20)}throw Error(label+': '+JSON.stringify(await state()))}
async function tabTo(selector){for(let i=0;i<60;i++){if(await read(`document.activeElement?.matches(${JSON.stringify(selector)})`))return;key('-k','Tab');await sleep(30)}throw Error('Native Tab target unavailable: '+selector)}
async function test(name,fn){const c={name,before:await state()};result.checks.push(c);try{assert(c.before.focus,'Native document focus required');await fn();c.pass=true}catch(e){c.pass=false;c.error=e.stack}c.after=await state();report('native-keyboard',result);console.log(JSON.stringify({name,pass:c.pass,error:c.error?.split('\n')[0]}))}
async function paste(text){const c=clipboard(text);owners.push(c);await sleep(100);assert.equal(native('wl-paste',['--no-newline']),text);ctrl('v');await sleep(150)}
try{
  await sleep(300);
  await read(`(()=>{globalThis.__nativeKeyboardEvents=[];globalThis.__nativeKeyboardRemove=[];for(const n of ['keydown','beforeinput','input','compositionstart','compositionend']){const f=e=>__nativeKeyboardEvents.push({type:e.type,trusted:e.isTrusted,key:e.key,ctrl:e.ctrlKey,shift:e.shiftKey,alt:e.altKey,meta:e.metaKey,altGraph:e.getModifierState?.('AltGraph'),composing:e.isComposing,inputType:e.inputType,data:e.data,target:e.target?.id||e.target?.className});document.addEventListener(n,f,true);__nativeKeyboardRemove.push(()=>document.removeEventListener(n,f,true))}return true})()`);
  // Establish an actual native focus target, rather than changing hasFocus.
  await tabTo('.rl-presentation button[aria-controls="rl-findbar"]');
  key('-k','Return');await until(s=>s.focus&&s.open,'Keyboard open Find');
  await test('Native typing/progressive query and Ctrl+G/Shift+G/Enter/Shift+Enter',async()=>{
    key('-d','30','upstream');await until(s=>s.query==='upstream'&&s.active===2,'Typed first match');
    ctrl('g');await until(s=>s.active===73,'Ctrl+G');
    key('-M','ctrl','-M','shift','-k','g','-m','shift','-m','ctrl');await until(s=>s.active===2,'Ctrl+Shift+G');
    key('-k','Return');await until(s=>s.active===73,'Enter');
    key('-M','shift','-k','Return','-m','shift');await until(s=>s.active===2,'Shift+Enter');
  });
  await test('Native full replacement, partial edit and no-match correction',async()=>{
    ctrl('a');key('up');await until(s=>s.query==='up'&&s.active===2,'Whole replacement');
    ctrl('g');await until(s=>s.active===73,'Navigate');key('-k','End','stream');await until(s=>s.query==='upstream'&&s.active===73,'Refine');
    key('x');await until(s=>s.query==='upstreamx'&&s.active===-1,'Zero hits');key('-k','BackSpace');await until(s=>s.query==='upstream'&&s.active===73,'Correction');
  });
  await test('Native paste, Undo/Redo, cut and private clipboard',async()=>{
    ctrl('a');await paste('upstream');await until(s=>s.query==='upstream'&&s.active===2,'Full paste');
    key('-k','End');await paste('x');await until(s=>s.query==='upstreamx','Partial paste');ctrl('z');await until(s=>s.query==='upstream','Undo');
    key('-M','ctrl','-M','shift','-k','z','-m','shift','-m','ctrl');await until(s=>s.query==='upstreamx','Redo');
    ctrl('a');ctrl('x');await until(s=>s.query===''&&s.active===-1,'Cut through empty');assert.equal(native('wl-paste',['--no-newline']),'upstreamx');
  });
  await test('Exact modifiers and compositor-delivered AltGraph',async()=>{
    key('upstream');await until(s=>s.active===2,'Query ready');const old=await state();
    key('-M','ctrl','-M','alt','-k','g','-m','alt','-m','ctrl');
    key('-M','ctrl','-M','shift','-k','f','-m','shift','-m','ctrl');
    key('-M','ctrl','-k','Return','-m','ctrl');
    key('-M','ctrl','-M','altgr','-k','g','-m','altgr','-m','ctrl');await sleep(100);
    const s=await state();assert.equal(s.active,old.active);assert.equal(s.query,old.query);
    assert(s.events.some(e=>e.key==='g'&&e.trusted&&e.altGraph),'AltGraph was not delivered');
  });
  await test('Native history menu, one-layer Escape, opener return and Ctrl+F',async()=>{
    key('-k','Return');await sleep(100);await tabTo('[aria-label="Search history"]');key('-k','Return');await until(s=>s.history,'History opens');
    key('-k','Escape');await until(s=>!s.history&&s.open,'One-layer history Escape');
    assert(await read(`document.activeElement?.getAttribute('aria-label')==='Search history'`));
    key('-k','Escape');await until(s=>!s.open,'Find Escape');
    assert(await read(`document.activeElement?.getAttribute('aria-controls')==='rl-findbar'`));
    ctrl('f');await until(s=>s.open&&s.query==='upstream','Ctrl+F retains query');
  });
  result.events=await read('globalThis.__nativeKeyboardEvents');
}catch(error){result.setupError=error.stack;process.exitCode=1}
finally{
  for(const c of owners)c.kill();
  try{await read('(()=>{for(const f of globalThis.__nativeKeyboardRemove??[])f();delete globalThis.__nativeKeyboardRemove;return true})()')}catch(e){result.cleanupError=String(e)}
  keep.kill();result.final=await state();report('native-keyboard',result);d.close();
}
