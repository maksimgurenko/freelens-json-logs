// Electron's native BrowserWindow operations, only after privateSession proof.
// This route does not claim window-manager button clicks or physical input.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { driver, report, sleep } from './driver.mjs';
import { isolatedInput } from './native-input.mjs';
const d=await driver(),result={route:'Electron BrowserWindow native API, exact private window ID',checks:[],session:isolatedInput().session};
const keyboard=spawn('wtype',['-s','600000'],{env:isolatedInput().env,stdio:'ignore'});
const state=()=>d.page.evaluate(`({query:document.querySelector('#rl-find')?.value,active:Number(document.querySelector('.rl-find-current')?.dataset.recordIndex??-1),focus:document.hasFocus(),viewport:document.querySelector('.rl-records')?.getBoundingClientRect().toJSON(),scroll:document.querySelector('.rl-records')?.scrollTop})`,d.cluster());
const proof=()=>isolatedInput();
async function check(name,fn){const c={name,before:await d.status(),viewBefore:await state()};result.checks.push(c);try{await fn(c);c.pass=true}catch(e){c.pass=false;c.error=e.stack}c.after=await d.status();try{c.viewAfter=await state()}catch{}report('native-window-lifecycle',result);console.log(JSON.stringify({name,pass:c.pass,error:c.error?.split('\n')[0]}))}
try{
 await sleep(300);
 proof();const id=await d.main.evaluate(`(()=>{const ws=process.mainModule.require('electron').BrowserWindow.getAllWindows();if(ws.length!==1)throw Error('One exact host window required');global.__native48Window=ws[0];return ws[0].id})()`);result.windowId=id;
 await check('Native hide/show preserves query, actually exits worker, reactivates',async c=>{
   proof();c.native=await d.main.evaluate(`(async()=>{const w=global.__native48Window;if(w.id!==${id}||w.isDestroyed())throw Error('Owned window changed');const sample=()=>({visible:w.isVisible(),minimized:w.isMinimized(),focused:w.isFocused(),workers:__findObserve.snapshot(),service:{owners:__findMain.find.owners.size,executions:[...__findMain.find.owners.values()].map(o=>({active:o.execution.active,running:!!o.execution.running,slot:!!o.execution.slot}))}});const before=sample();w.hide();await new Promise(r=>setTimeout(r,500));const hidden=sample();w.show();await new Promise(r=>setTimeout(r,500));return {before,hidden,returned:sample()}})()`);
   assert.equal(c.native.hidden.visible,false);assert.equal(c.native.hidden.workers.live,0);assert(c.native.hidden.workers.exits>c.native.before.workers.exits,'Actual worker exit on hide');assert.equal(c.native.returned.visible,true);
   assert.equal((await state()).query,c.viewBefore.query);
 });
 await check('Native minimize/restore support and worker cleanup',async c=>{
   proof();c.native=await d.main.evaluate(`(async()=>{const w=global.__native48Window;if(w.id!==${id}||w.isDestroyed())throw Error('Owned window changed');const sample=()=>({minimized:w.isMinimized(),visible:w.isVisible(),workers:__findObserve.snapshot()});const before=sample();w.minimize();await new Promise(r=>setTimeout(r,500));const minimized=sample();w.restore();await new Promise(r=>setTimeout(r,500));return {before,minimized,returned:sample()}})()`);
   assert.equal(c.native.minimized.minimized,true,'Compositor did not acknowledge minimize');assert.equal(c.native.minimized.workers.live,0);assert.equal(c.native.returned.minimized,false);
 });
 await check('Native owned auxiliary window changes OS focus and tiled host geometry; return preserves state',async c=>{
   proof();c.native=await d.main.evaluate(`(async()=>{const E=process.mainModule.require('electron'),w=global.__native48Window;if(w.id!==${id}||w.isDestroyed())throw Error('Owned window changed');const sample=()=>({bounds:w.getBounds(),focused:w.isFocused(),workers:__findObserve.snapshot()});const before=sample();const aux=new E.BrowserWindow({width:400,height:300,show:false,webPreferences:{nodeIntegration:false,contextIsolation:true}});global.__native48Aux=aux;await aux.loadURL('data:text/html,<title>Owned native focus fixture</title><p>Private session only</p>');aux.show();aux.focus();await new Promise(r=>setTimeout(r,500));const foreign={...sample(),auxId:aux.id,auxFocused:aux.isFocused()};aux.close();await new Promise(r=>setTimeout(r,500));w.focus();await new Promise(r=>setTimeout(r,250));return {before,foreign,returned:sample(),auxDestroyed:aux.isDestroyed()}})()`);
   assert(c.native.foreign.auxFocused&&!c.native.foreign.focused,'OS focus left viewer');assert.equal(c.native.foreign.workers.live,0);assert(c.native.foreign.bounds.width!==c.native.before.bounds.width||c.native.foreign.bounds.height!==c.native.before.bounds.height,'No native resize delivered');assert(c.native.auxDestroyed);assert.equal((await state()).query,c.viewBefore.query);
 });
 // Keep close last. Actual destruction/worker exit are observed via main CDP.
 await check('Native close owning host window and actual execution cleanup',async c=>{
   proof();c.close=await d.main.evaluate(`(async()=>{const w=global.__native48Window;if(w.id!==${id}||w.isDestroyed())throw Error('Owned window changed');w.close();await new Promise(r=>setTimeout(r,500));return {destroyed:w.isDestroyed(),windows:process.mainModule.require('electron').BrowserWindow.getAllWindows().map(x=>x.id)}})()`);
   c.cleaned=await d.wait(s=>!s.live&&!s.service.owners&&!s.service.retiring&&!s.service.senders&&!s.service.watch);
   assert(c.close.destroyed);assert.equal(c.close.windows.length,0);
 });
}finally{keyboard.kill();report('native-window-lifecycle',result);d.close()}
