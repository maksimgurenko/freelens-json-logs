import {session,assert,isolatedInput,sleep} from './native-completion-common.mjs';
const s=await session('native-pending-completion');const {d,read,state,test,query,key,ctrl,button}=s;
const arm=(text,work='match')=>d.main.evaluate(`__pendingNative.next=${JSON.stringify({text,work})};true`);
const release=()=>d.main.evaluate(`__pendingNative.release();true`);
async function capture(){for(let i=0;i<120;i++){if(await d.main.evaluate('__pendingNative.held.length>0'))return;await sleep(3)}throw Error('Actual SDK reply not captured')}
async function typeHeld(text,work='match'){await arm(text,work);ctrl('f');ctrl('a');key(text);await capture();assert(await read("document.querySelector('.rl-find-direction').disabled")||work==='ranges');}
async function ready(){return s.until(x=>x.count?.includes('matching records'),'Match completion')}
try{
 await s.navigate();await button('Pause');await query('');
 await d.main.evaluate(`(()=>{const ipc=process.mainModule.require('electron').ipcMain,channel=[...ipc._invokeHandlers.keys()].find(x=>x.endsWith(':find-request')),original=ipc._invokeHandlers.get(channel);const s=global.__pendingNative={ipc,channel,original,next:null,held:[],calls:[],release(){for(const h of this.held.splice(0))h.resolve(h.value)}};ipc._invokeHandlers.set(channel,async(...args)=>{const r=args[2],g=s.next?.text===r.query.text&&s.next.work===r.work?s.next:undefined;if(g)s.next=null;const value=await original(...args);s.calls.push({text:r.query.text,work:r.work,key:r.key,interest:r.rangeInterest?.id,kind:value.kind,held:!!g});if(!g)return value;return new Promise(resolve=>s.held.push({resolve,value}))});return true})()`);
 for(const mode of ['wheel','close-find','escape-find','close-inspector','escape-inspector']){
  await test(mode,'D11/D14/D15 traces5/7: actual held match reply, native '+mode+' invalidates only affected intent; current counts may update without late focus/scroll/inspection resurrection',async c=>{
   await query('');if((await state()).inspected!==-1)await button('Close record inspector');
   if(mode.includes('inspector')){await s.reveal('[data-record-index="64"] .rl-row');await s.click('[data-record-index="64"] .rl-row')}
   await typeHeld('upstream');c.pending=await state();
   if(mode==='wheel'){await s.wheel(-6);await sleep(180);assert((await state()).scroll<c.pending.scroll,'Actual native manual scroll required')}
   else if(mode==='close-find')await button('Close Find');
   else if(mode==='escape-find')key('-k','Escape');
   else if(mode==='close-inspector')await button('Close record inspector');
   else { // Escape first dismisses Find, then the inspector; exactly one layer each.
    key('-k','Escape');assert.equal((await state()).inspected,64);key('-k','Escape');
   }
   c.dismissed=await state();await release();await ready();await sleep(80);c.released=await state();
   assert.equal(c.released.scroll,c.dismissed.scroll,'No late jump');assert.equal(c.released.focused,c.dismissed.focused,'No delayed focus theft');assert.equal(c.released.inspected,c.dismissed.inspected);assert.equal(c.released.update,'Paused');assert.equal(c.released.count,mode==='wheel'?'1 of 4 matching records':'0 of 4 matching records');
   if(mode!=='wheel')assert.equal(c.released.active,-1);
   if(!c.dismissed.open){await button('Find');await ready();assert.equal((await state()).scroll,c.released.scroll);assert.equal((await state()).active,-1)}
  });
 }
 await test('range-scroll','D07/D15: actual held range reply after native wheel/Close cannot paint stale interest or jump; exact matching remains useful',async c=>{
  await query('');await typeHeld('upstream','ranges');assert.equal((await state()).count,'1 of 4 matching records');await s.wheel(6);await button('Close Find');c.beforeRelease=await state();await release();await sleep(100);c.afterRelease=await state();assert.equal(c.afterRelease.scroll,c.beforeRelease.scroll);assert.equal(c.afterRelease.focused,c.beforeRelease.focused);assert.equal(c.afterRelease.update,'Paused');c.ranges=await read(`[...CSS.highlights].flatMap(([name,h])=>[...h].map(r=>({name,text:r.toString()})))`);
 });
 await test('native-resize','D07/D15 trace13: native auxiliary window resizes actual tiled host; retained native selection/source nodes, highlights and measured marks remain valid',async c=>{
  await query('upstream');await s.reveal('[data-record-index="2"] [data-find-source="message"]');await s.drag('[data-record-index="2"] [data-find-source="message"]',0,14);assert.equal((await state()).selection,'row 2 upstream');
  await read(`(()=>{const x=getSelection();globalThis.__resizeSelection={a:x.anchorNode,f:x.focusNode,ao:x.anchorOffset,fo:x.focusOffset};return true})()`);
  isolatedInput();const id=await d.main.evaluate(`(()=>{const w=process.mainModule.require('electron').BrowserWindow.getAllWindows();if(w.length!==1)throw Error('Exact owned window');global.__resizeMain=w[0];return w[0].id})()`);
  c.before=await read(`({width:innerWidth,height:innerHeight})`);
  try{
   isolatedInput();c.native=await d.main.evaluate(`(async()=>{const E=process.mainModule.require('electron'),w=__resizeMain;if(w.id!==${id}||w.isDestroyed())throw Error('Owned window');const aux=global.__resizeAux=new E.BrowserWindow({show:false,width:400,height:300});await aux.loadURL('data:text/html,<title>Owned resize fixture</title><p>Private session</p>');aux.show();aux.focus();await new Promise(r=>setTimeout(r,150));return {mainFocused:w.isFocused(),auxFocused:aux.isFocused(),main:w.getBounds(),auxId:aux.id}})()`);
   await sleep(100);c.resized=await read(`(()=>{const x=getSelection(),r=__resizeSelection,s=document.querySelector('.rl-records');return {width:innerWidth,height:innerHeight,selection:x.toString(),same:x.anchorNode===r.a&&x.focusNode===r.f&&x.anchorOffset===r.ao&&x.focusOffset===r.fo,marks:[...document.querySelectorAll('.rl-find-mark')].map(e=>({label:e.getAttribute('aria-label'),top:parseFloat(e.style.top)})),highlights:[...CSS.highlights].flatMap(([name,h])=>[...h].map(r=>({name,text:r.toString()}))),rows:[2,73,82,90].map(i=>{const e=document.querySelector('[data-record-index="'+i+'"]');return {i,expected:(e.getBoundingClientRect().top-s.getBoundingClientRect().top-s.clientTop+s.scrollTop)/s.scrollHeight*s.clientHeight}})}})()`);
   assert(c.native.auxFocused&&!c.native.mainFocused);assert.notEqual(c.resized.width,c.before.width);assert(c.resized.same);assert.equal(c.resized.selection,'row 2 upstream');assert.equal(c.resized.marks.length,4);for(let i=0;i<4;i++)assert(Math.abs(c.resized.marks[i].top-c.resized.rows[i].expected)<=14);assert(c.resized.highlights.some(r=>r.text==='upstream'));
  }finally{isolatedInput();await d.main.evaluate(`(()=>{if(__resizeMain.id!==${id})throw Error('Owned main changed');if(global.__resizeAux&&!__resizeAux.isDestroyed())__resizeAux.destroy();__resizeMain.focus();delete global.__resizeAux;delete global.__resizeMain;return true})()`);await read('delete globalThis.__resizeSelection;true')}
  c.returned=await state();assert.equal(c.returned.selection,'row 2 upstream');assert.equal(c.returned.update,'Paused');
 });
 await test('initial-previous','D03/D09: initial Previous after dismissed current completion addresses last retained match, then wraps to first',async c=>{
  await query('');await typeHeld('upstream');await button('Close Find');await release();await ready();assert.equal((await state()).active,-1);
  await button('Find');key('-M','shift','-k','Return','-m','shift');await s.until(x=>x.active===90,'Initial Previous is last');key('-k','Return');await s.until(x=>x.active===2,'Native forward wrap to first');
 });
 s.result.calls=await d.main.evaluate('__pendingNative.calls');
}finally{
 s.result.handlerRestored=await d.main.evaluate(`(()=>{const s=global.__pendingNative;if(!s)return true;s.release();s.ipc._invokeHandlers.set(s.channel,s.original);const ok=s.ipc._invokeHandlers.get(s.channel)===s.original;delete global.__pendingNative;return ok})()`).catch(()=>false);
 await s.close();
}
