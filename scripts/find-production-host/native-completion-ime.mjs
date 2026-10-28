import {session,assert,isolatedInput,sleep} from './native-completion-common.mjs';
import {spawn} from 'node:child_process';
const s=await session('native-ime-completion');const {d,read,state,test,query,key,ctrl,button}=s;let ime,output='';
async function send(line){isolatedInput();const before=output.length;ime.stdin.write(line+'\n');for(let i=0;i<100;i++){if(output.slice(before).includes('"ok":true'))return;await sleep(5)}throw Error('IME command failed '+line+': '+output.slice(before))}
const calls=()=>d.main.evaluate('__imeCalls.calls.filter(c=>c.work==="match")');
async function compose(text){await send('P '+text);await s.until(()=>read(`__nativeCompletionEvents.some(e=>e.type==='compositionstart'&&e.trusted)`),'Native preedit');}
async function commit(text){await send('C '+text);await s.until(x=>x.query===text&&x.count?.includes('matching records'),'Native commit ready')}
try{
 await s.navigate();await button('Pause');await query('upstream');
 await read(`(()=>{const p=EventTarget.prototype;globalThis.__nativeDispatchObserver={p,descriptor:Object.getOwnPropertyDescriptor(p,'dispatchEvent'),original:p.dispatchEvent,events:[]};const s=__nativeDispatchObserver;p.dispatchEvent=function(e){if(e.type.startsWith('composition'))s.events.push({type:e.type,trusted:e.isTrusted,stack:new Error().stack});return s.original.call(this,e)};return true})()`);
 await d.main.evaluate(`(()=>{const ipc=process.mainModule.require('electron').ipcMain,channel=[...ipc._invokeHandlers.keys()].find(x=>x.endsWith(':find-request'));const original=ipc._invokeHandlers.get(channel);global.__imeCalls={ipc,channel,original,calls:[]};ipc._invokeHandlers.set(channel,(...args)=>{__imeCalls.calls.push({work:args[2].work,text:args[2].query.text,key:args[2].key});return original(...args)});return true})()`);
 ime=spawn('.scratch/find/48-host/native-ime-transactions',[],{env:isolatedInput().env,stdio:['pipe','pipe','pipe']});s.owned.push(ime);ime.stdout.on('data',b=>output+=b);ime.stderr.on('data',b=>output+='stderr:'+b);
 await sleep(100);key('-k','Tab');key('-M','shift','-k','Tab','-m','shift');await sleep(100);await send('S');assert(output.includes('"active":true'));
 await test('whole-preedit-commit','D04/D06 trace10: native select-all composition suspends matching/navigation; full replacement seeks from beginning and commits once',async c=>{
  ctrl('f');ctrl('a');const before=(await calls()).length;await compose('up');c.preedit=await state();assert(await read("document.querySelector('.rl-find-direction').disabled"));assert.equal((await calls()).length,before);
  await send('P upstream');assert.equal((await calls()).length,before);await commit('upstream');c.calls=(await calls()).slice(before);assert.equal(c.calls.length,1);assert.equal((await state()).active,2);
 });
 await test('partial-replacement','D06 trace10: partial native composition refines candidate rather than whole-input replacement',async c=>{
  ctrl('g');await s.until(x=>x.active===73,'Navigate 73');key('-k','End');const before=(await calls()).length;await send('P x');await send('C x');await s.until(x=>x.query==='upstreamx'&&x.count?.includes('matching records'),'Partial native commit');assert.equal((await state()).active,-1);
  key('-k','BackSpace');await s.until(x=>x.query==='upstream'&&x.active===73,'Correction preserves candidate');c.calls=(await calls()).slice(before);
 });
 await test('cancel','D06: native preedit cancellation restores prior committed query and does not advance result',async c=>{
  key('-k','End');const before=await state();await send('P x');await send('X');await s.until(x=>x.query==='upstream'&&x.count?.includes('matching records'),'Composition cancel');const after=await state();assert.equal(after.active,before.active);c.beforeCancel=before;c.afterCancel=after;
 });
 await test('clear-late-completion','D06/D11 trace10: Clear during native composition keeps empty Find after delayed IME preedit cancellation; existing DOM regression separately covers late compositionend',async c=>{
  ctrl('f');ctrl('a');await send('P stale');await button('Clear Find');await s.until(x=>x.query==='','Native Clear');
  // Clear refocuses Find. The IME still owns the native transaction until this
  // protocol cancellation arrives; no DOM composition event is dispatched.
  await send('X');await sleep(100);c.after=await state();assert.equal(c.after.query,'');assert.equal(c.after.active,-1);assert.equal(c.after.count,'Enter text to find');assert.equal(await read('CSS.highlights.size'),0);
 });
 await test('japanese-preedit-commit','D04/D06: real Japanese preedit and commit through input-method-v2, no DOM composition injection',async c=>{
  ctrl('f');ctrl('a');await send('P あ');assert(await read("document.querySelector('.rl-find-direction').disabled"));await commit('あ');assert.equal((await state()).count,'0 of 0 matching records');c.events=await read("__nativeCompletionEvents.filter(e=>e.type.startsWith('composition')).slice(-4)");
 });
 await test('enter-commit','D06 trace10: compositor keyboard Enter is consumed by actual input-method grab to commit; Find does not navigate',async c=>{
  ctrl('f');ctrl('a');await send('P upstream');const before=(await calls()).length;await send('E upstream');key('-k','Return');await s.until(x=>x.query==='upstream'&&x.count?.includes('matching records'),'Enter IME commit');assert.equal((await state()).active,2);assert(output.includes('"keysym":65293'));assert.equal((await calls()).length-before,1);c.grab='Real zwp_input_method_keyboard_grab_v2 receives compositor Enter, commits text, consumes the key';
 });
 s.result.dispatchProvenance=await read('__nativeDispatchObserver.events');s.result.matchCalls=await calls();s.result.events=await read('__nativeCompletionEvents');
}finally{
 s.result.dispatchRestored=await read(`(()=>{const s=__nativeDispatchObserver;Object.defineProperty(s.p,'dispatchEvent',s.descriptor);const ok=s.p.dispatchEvent===s.original;delete globalThis.__nativeDispatchObserver;return ok})()`);
 if(ime){ime.stdin.end('Q\n');await sleep(100)}s.result.imeOutput=output;
 s.result.handlerRestored=await d.main.evaluate(`(()=>{const s=global.__imeCalls;if(!s)return true;s.ipc._invokeHandlers.set(s.channel,s.original);const ok=s.ipc._invokeHandlers.get(s.channel)===s.original;delete global.__imeCalls;return ok})()`).catch(()=>false);
 await s.close();
}
