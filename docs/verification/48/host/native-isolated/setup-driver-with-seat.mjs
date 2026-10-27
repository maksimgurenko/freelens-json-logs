// One bounded pass: compositor-local virtual input, with CDP observation only.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { driver, report, sleep } from './driver.mjs';
import { isolatedInput, native, clipboard } from './native-input.mjs';
const d = await driver(), result = { route: 'zwp_virtual_keyboard_v1 (wtype), zwlr_virtual_pointer_v1, private Wayland clipboard',
  physicalHardware: false, checks: [], clipboardOwners: [], session: isolatedInput().session };
const owners = [];
// A headless seat has no physical keyboard. Keep one protocol device attached
// throughout the pass so keyboard capability/focus does not disappear per key.
const keyboard = spawn('wtype', ['-s', '1200000'], { env: isolatedInput().env, stdio: 'ignore' });
result.keyboardSeat = { pid: keyboard.pid, route: 'persistent zwp_virtual_keyboard_v1; no hardware' };
const read = expression => d.page.evaluate(expression, d.cluster());
const state = () => read(`(()=>{const q=document.querySelector('#rl-find'),s=document.querySelector('.rl-records');return {
  query:q?.value,open:!!q?.getClientRects().length,count:document.querySelector('.rl-find-count')?.textContent,
  active:Number(document.querySelector('.rl-find-current')?.dataset.recordIndex??-1),
  inspected:Number(document.querySelector('.rl-selected')?.dataset.recordIndex??-1),
  focus:document.hasFocus(),focused:document.activeElement?.outerHTML.slice(0,250),
  selection:getSelection()?.toString(),inputSelection:q?[q.selectionStart,q.selectionEnd]:null,
  scroll:s?.scrollTop,viewport:s?[s.clientWidth,s.clientHeight,s.scrollHeight]:null,
  pause:document.querySelector('.rl-update-status')?.textContent,events:globalThis.__native48Events?.slice(-35)};})()`);
const until = async (predicate, label) => {
  for(let i=0;i<100;i++){const s=await state();if(predicate(s))return s;await sleep(20)}
  throw Error(label+'; '+JSON.stringify(await state()));
};
const key = (...args) => native('wtype', args);
const chord = (mod, name) => key('-M',mod,'-k',name,'-m',mod);
async function position(selector, fraction=.5) {
  const {session}=isolatedInput();
  const clients=JSON.parse(native('hyprctl',['clients','-j']));
  const win=clients.find(c=>c.pid===session.pid);assert(win?.mapped);
  const monitor=JSON.parse(native('hyprctl',['monitors','-j']));
  assert.equal(monitor.length,1);assert.equal(monitor[0].width,1280);assert.equal(monitor[0].height,720);
  const frame=await d.page.evaluate(`document.querySelector('iframe').getBoundingClientRect().toJSON()`,d.root());
  const rect=await read(`(()=>{const x=document.querySelector(${JSON.stringify(selector)});if(!x)throw Error('Missing '+${JSON.stringify(selector)});return x.getBoundingClientRect().toJSON()})()`);
  assert(rect.width>0&&rect.height>0,'Visible native target');
  return [Math.round(win.at[0]+frame.x+rect.x+rect.width*fraction),Math.round(win.at[1]+frame.y+rect.y+rect.height/2)];
}
async function click(selector){native('.scratch/find/48-host/native-pointer',['click',...(await position(selector)).map(String)]);await sleep(70)}
async function test(name, action){
  const entry={name,before:await state()};result.checks.push(entry);
  try {await action();entry.pass=true} catch(error){entry.pass=false;entry.error=error.stack}
  entry.after=await state();report('native-acceptance',result);console.log(JSON.stringify({name,pass:entry.pass,error:entry.error?.split('\n')[0]}));
}
async function paste(text){const child=clipboard(text);owners.push(child);result.clipboardOwners.push(child.pid);
  for(let i=0;i<50;i++){await sleep(20);try{if(native('wl-paste',['--no-newline'])===text)break}catch{}assert(i<49,'Private clipboard not ready')}
  chord('ctrl','v');await sleep(150);
}
async function replace(text){await click('#rl-find');chord('ctrl','a');key('--',text);await until(s=>s.query===text,'Native replacement')}
try {
  await read(`(()=>{globalThis.__native48Events=[];globalThis.__native48Remove=[];for(const name of ['keydown','beforeinput','input','compositionstart','compositionupdate','compositionend','pointerdown','pointerup','wheel']){const fn=e=>{__native48Events.push({type:e.type,trusted:e.isTrusted,key:e.key,code:e.code,ctrl:e.ctrlKey,shift:e.shiftKey,alt:e.altKey,meta:e.metaKey,altGraph:e.getModifierState?.('AltGraph'),composing:e.isComposing,inputType:e.inputType,data:e.data,target:e.target?.id||e.target?.className});if(__native48Events.length>1500)__native48Events.shift()};document.addEventListener(name,fn,true);__native48Remove.push(()=>document.removeEventListener(name,fn,true))}return true})()`);
  await test('Native pointer focuses viewer and opens Find; trusted progressive typing',async()=>{
    await click('.rl-presentation button[aria-controls="rl-findbar"]');
    await until(s=>s.open&&s.focus,'Native focus/open');key('-d','30','upstream');
    const s=await until(s=>s.query==='upstream'&&s.count?.includes('4 matching records'),'Typed query');
    assert.equal(s.active,2);assert(s.events.some(e=>e.type==='keydown'&&e.trusted&&e.key==='u'));
    assert(s.events.some(e=>e.type==='pointerdown'&&e.trusted));
  });
  await test('Ctrl+G / Ctrl+Shift+G / Enter / Shift+Enter',async()=>{
    chord('ctrl','g');await until(s=>s.active===73,'Ctrl+G');
    key('-M','ctrl','-M','shift','-k','g','-m','shift','-m','ctrl');await until(s=>s.active===2,'Ctrl+Shift+G');
    key('-k','Return');await until(s=>s.active===73,'Enter');
    chord('shift','Return');await until(s=>s.active===2,'Shift+Enter');
  });
  await test('Exact modifier rejection and native AltGraph delivery',async()=>{
    const before=await state();
    assert(before.open&&before.focus,'Focused Find required for modifier ownership');
    key('-M','ctrl','-M','alt','-k','g','-m','alt','-m','ctrl');
    key('-M','ctrl','-M','shift','-k','f','-m','shift','-m','ctrl');
    key('-M','ctrl','-k','Return','-m','ctrl');
    key('-M','altgr','-M','ctrl','-k','g','-m','ctrl','-m','altgr');await sleep(100);
    const s=await state();assert.equal(s.active,before.active);assert.equal(s.query,before.query);
    const events=s.events.filter(e=>e.type==='keydown'&&e.key?.toLowerCase()==='g');
    assert(events.some(e=>e.trusted&&e.altGraph),'No genuine AltGraph modifier delivered by this virtual keymap');
  });
  await test('Native full replacement, refinement, no-match correction',async()=>{
    await replace('up');await until(s=>s.active===2,'Replacement origin');
    chord('ctrl','g');await until(s=>s.active===73,'Navigate before refinement');
    key('-k','End','stream');await until(s=>s.query==='upstream'&&s.active===73,'Refinement retained candidate');
    key('x');await until(s=>s.query==='upstreamx'&&s.active===-1,'Temporary zero hits');
    key('-k','BackSpace');await until(s=>s.query==='upstream'&&s.active===73,'Correction retained candidate');
  });
  await test('Private native paste, Undo, Redo, cut through empty',async()=>{
    chord('ctrl','a');await paste('upstream');await until(s=>s.query==='upstream'&&s.active===2,'Full paste origin');
    key('-k','End');await paste('x');await until(s=>s.query==='upstreamx','Partial paste');
    chord('ctrl','z');await until(s=>s.query==='upstream','Undo');
    key('-M','ctrl','-M','shift','-k','z','-m','shift','-m','ctrl');await until(s=>s.query==='upstreamx','Redo');
    chord('ctrl','a');chord('ctrl','x');await until(s=>s.query===''&&s.active===-1,'Cut to empty');
    assert.equal(native('wl-paste',['--no-newline']),'upstreamx');
  });
  await test('Native history menu Escape, Find Escape and opener focus return',async()=>{
    await replace('upstream');await until(s=>s.count?.includes('4 matching records'),'Query ready');
    key('-k','Return');await sleep(100);await click('[aria-label="Search history"]');
    assert(await read(`!!document.querySelector('.rl-find-history-popover')?.getClientRects().length`));
    key('-k','Escape');await sleep(100);assert((await state()).open);
    assert(await read(`document.activeElement?.getAttribute('aria-label')==='Search history'`));
    key('-k','Escape');await until(s=>!s.open,'Escape closes Find');
    assert(await read(`document.activeElement?.getAttribute('aria-controls')==='rl-findbar'`));
    chord('ctrl','f');await until(s=>s.open&&s.focus,'Ctrl+F reopens');
    assert.equal((await state()).query,'upstream');
  });
  await test('Native wheel scroll and native drag selection/copy of highlighted source',async()=>{
    await click('[aria-label="Clear Find"]');
    const p=await position('.rl-records');native('.scratch/find/48-host/native-pointer',['scroll',...p.map(String),'-200']);
    await until(s=>s.scroll===0,'Native wheel to top');
    await click('[aria-label="Close Find"]');
    // Select row 2 actual source by measured Range rectangles; CDP does not set selection.
    const {session}=isolatedInput();const win=JSON.parse(native('hyprctl',['clients','-j'])).find(c=>c.pid===session.pid);
    const frame=await d.page.evaluate(`document.querySelector('iframe').getBoundingClientRect().toJSON()`,d.root());
    const rect=await read(`(()=>{const e=document.querySelector('[data-record-index="2"] [data-find-source="message"]');const r=document.createRange();r.selectNodeContents(e);return r.getBoundingClientRect().toJSON()})()`);
    const x=win.at[0]+frame.x+rect.x,y=win.at[1]+frame.y+rect.y+rect.height/2;
    native('.scratch/find/48-host/native-pointer',['drag',String(Math.round(x)),String(Math.round(y)),String(Math.round(x+rect.width)),String(Math.round(y))]);
    const s=await until(s=>s.selection==='row 2 upstream','Native drag text');assert.equal(s.inspected,-1);
    chord('ctrl','c');await sleep(150);assert.equal(native('wl-paste',['--no-newline']),'row 2 upstream');
    chord('ctrl','f');await until(s=>s.open&&s.query==='row 2 upstream','Selection seeds empty Find');
    key('-k','Escape');await sleep(100);
  });
  result.events=await read('globalThis.__native48Events');
  result.final=await state();
} finally {
  for(const child of owners){child.kill();await Promise.race([new Promise(r=>child.once('close',r)),sleep(500)])}
  try{await read('(()=>{for(const remove of globalThis.__native48Remove??[])remove();delete globalThis.__native48Remove;return true})()')}catch(error){result.cleanupError=String(error)}
  report('native-acceptance',result);d.close();
  keyboard.kill();
}
