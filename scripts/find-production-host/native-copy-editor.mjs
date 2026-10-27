import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { driver, report, sleep } from './driver.mjs';
import { isolatedInput, native } from './native-input.mjs';
import { evidence } from './config.mjs';
const d=await driver(),result={route:'private Wayland virtual keyboard; real production inspector copy actions and profile sample editor',physicalHardware:false,checks:[]};
const keep=spawn('wtype',['-s','600000'],{env:isolatedInput().env,stdio:'ignore'});
const read=x=>d.page.evaluate(x,d.cluster());
const key=(...args)=>native('wtype',['-s','100',...args]);
const state=()=>read(`({query:document.querySelector('#rl-find')?.value,open:!!document.querySelector('#rl-find')?.getClientRects().length,focus:document.hasFocus(),active:Number(document.querySelector('.rl-find-current')?.dataset.recordIndex??-1),inspected:Number(document.querySelector('.rl-selected')?.dataset.recordIndex??-1),editor:!!document.querySelector('.rl-profile-editor'),focused:document.activeElement?.outerHTML.slice(0,250)})`);
async function tabTo(expression,back=false){for(let i=0;i<160;i++){if(await read(expression))return;key(...(back?['-M','shift','-k','Tab','-m','shift']:['-k','Tab']));await sleep(20)}throw Error('Native Tab target unavailable')}
async function test(name,fn){const c={name,before:await state()};result.checks.push(c);try{await fn(c);c.pass=true}catch(e){c.pass=false;c.error=e.stack}c.after=await state();report('native-copy-editor',result);console.log(JSON.stringify({name,pass:c.pass,error:c.error?.split('\n')[0]}))}
try{
 await sleep(300);
 await test('Keyboard row activation; exact Application text and Transport line on private compositor clipboard',async c=>{
   if((await state()).open)key('-k','Escape');
   await tabTo(`document.activeElement?.matches('[aria-label="Inspect record 1: row 0"]')`);key('-k','Return');await sleep(100);
   assert.equal((await state()).inspected,0);
   const fixture=JSON.parse(readFileSync(`${evidence}/fixture.json`));
   c.transport=execFileSync('kubectl',['--context','kind-freelens-json-logs-spike','-n',fixture.namespace,'logs','find-fixtures','-c','traces','--timestamps=true'],{encoding:'utf8'}).split('\n')[0];
   c.application=c.transport.slice(c.transport.indexOf(' ')+1);
   await tabTo(`document.activeElement?.textContent==='Copy application text'`,true);key('-k','Return');await sleep(150);
   c.applicationClipboard=native('wl-paste',['--no-newline']);assert.equal(c.applicationClipboard,c.application);
   key('-k','Tab','-k','Return');await sleep(150);c.transportClipboard=native('wl-paste',['--no-newline']);assert.equal(c.transportClipboard,c.transport);
   key('-k','Escape');await sleep(100);assert.equal((await state()).inspected,-1);
 });
 await test('Real profile sample editor retains native Ctrl+F/G ownership and Escape returns to logs',async c=>{
   await tabTo(`document.activeElement?.textContent==='Edit profiles'`,true);key('-k','Return');await sleep(100);assert((await state()).editor);
   await tabTo(`document.activeElement?.matches('[aria-label="Sample logs"]')`);
   c.sampleBefore=await read(`document.activeElement.value`);
   key('-M','ctrl','-k','f','-k','g','-m','ctrl');await sleep(100);
   const s=await state();assert(s.editor&&!s.open);assert.equal(s.query,c.before.query);
   assert(await read(`document.activeElement?.matches('[aria-label="Sample logs"]')`));
   assert.equal(await read(`document.activeElement.value`),c.sampleBefore);
   key('-k','Escape');await sleep(100);assert(!(await state()).editor);
 });
}finally{keep.kill();result.final=await state();report('native-copy-editor',result);d.close()}
