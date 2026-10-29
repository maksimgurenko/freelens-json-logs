// Independent review follow-up: distinguish replacement from refinement using
// different reading origin and candidate; replace a genuinely selected suffix.
import {session,assert,isolatedInput,sleep,evidence} from './native-completion-common.mjs';
import {spawn} from 'node:child_process';
import {writeFileSync} from 'node:fs';
const s=await session('native-reviewed-completion');const {d,read,state,key,ctrl,button,test}=s;let ime,output='';
async function command(line){isolatedInput();const at=output.length;ime.stdin.write(line+'\n');for(let i=0;i<100;i++){if(output.slice(at).includes('"ok":true'))return;await sleep(5)}throw Error('IME command failed '+line)}
const calls=()=>d.main.evaluate('__replacementCalls.calls.filter(c=>c.work==="match")');
const selection=()=>read(`(()=>{const q=document.querySelector('#rl-find');return {text:q.value,start:q.selectionStart,end:q.selectionEnd}})()`);
function contrast(a,b){const l=c=>{const v=c.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return v[0]*.2126+v[1]*.7152+v[2]*.0722};return (Math.max(l(a),l(b))+.05)/(Math.min(l(a),l(b))+.05)}
try{
 await s.click('[data-testid^="close-notification-for-"]','root');await s.navigate();await button('Pause');await s.reveal('[data-record-index="64"] .rl-row');await s.click('[data-record-index="64"] .rl-row');await s.query('upstream');ctrl('g');await s.until(x=>x.active===82,'Distinct candidate82 from reading64');
 await d.main.evaluate(`(()=>{const ipc=process.mainModule.require('electron').ipcMain,channel=[...ipc._invokeHandlers.keys()].find(x=>x.endsWith(':find-request')),original=ipc._invokeHandlers.get(channel);global.__replacementCalls={ipc,channel,original,calls:[]};ipc._invokeHandlers.set(channel,(...args)=>{__replacementCalls.calls.push({work:args[2].work,text:args[2].query.text,key:args[2].key});return original(...args)});return true})()`);
 ime=spawn('.scratch/find/48-host/native-ime-transactions',[],{env:isolatedInput().env,stdio:['pipe','pipe','pipe']});s.owned.push(ime);ime.stdout.on('data',b=>output+=b);ime.stderr.on('data',b=>output+='stderr:'+b);await sleep(100);key('-k','Tab');key('-M','shift','-k','Tab','-m','shift');await command('S');assert(output.includes('"active":true'));
 await test('whole-selected-replacement','D06 trace10: whole-input native IME replacement from candidate82 starts a new sequence at reading64, finding73; preedit does not search and commit evaluates once',async c=>{
  ctrl('a');c.selection=await selection();assert.deepEqual(c.selection,{text:'upstream',start:0,end:8});assert.equal((await state()).active,82);const before=(await calls()).length;
  await command('P up');await command('P upstream');assert.equal((await calls()).length,before);await command('C upstream');await s.until(x=>x.query==='upstream'&&x.active===73,'Whole replacement must choose73, not retain82');c.matchCalls=(await calls()).slice(before);assert.equal(c.matchCalls.length,1);
 });
 await test('partial-selected-replacement','D06 trace10: native selected suffix [2,8) replaced through IME refines and retains candidate82, unlike whole replacement73',async c=>{
  ctrl('g');await s.until(x=>x.active===82,'Candidate82');key('-k','End','-M','shift',...Array.from({length:6},()=>['-k','Left']).flat(),'-m','shift');c.selection=await selection();assert.deepEqual(c.selection,{text:'upstream',start:2,end:8});const before=(await calls()).length;
  await command('P stream');assert.equal((await calls()).length,before);await command('C stream');await s.until(x=>x.query==='upstream'&&x.count?.includes('matching records'),'Selected partial commit');assert.equal((await state()).active,82);c.matchCalls=(await calls()).slice(before);assert.equal(c.matchCalls.length,1);
 });
 ime.stdin.end('Q\n');await sleep(100);
 await test('native-contrast-selection','D07: actual light-themed host ordinary/hovered/inspected/native-selected text and Find highlights retain contrast on the black canvas; exact drag and clipboard remain intact',async c=>{
  await button('Close record inspector');await s.query('upstream');await s.reveal('[data-record-index="2"] [data-find-source="message"]');await s.pointerCommand(['move',50,300]);
  const styles=()=>read(`(()=>{const row=document.querySelector('[data-record-index="2"] .rl-row'),text=document.querySelector('[data-record-index="2"] [data-find-source="message"]'),r=getComputedStyle(row),sel=getComputedStyle(row,'::selection');return {theme:document.body.className,row:r.color,background:r.backgroundColor,canvas:getComputedStyle(document.querySelector('.rl-records')).backgroundColor,selection:{color:sel.color,background:sel.backgroundColor},inspector:document.querySelector('.rl-detail')?{color:getComputedStyle(document.querySelector('.rl-detail')).color,background:getComputedStyle(document.querySelector('.rl-detail')).backgroundColor}:null}})()`);
  c.ordinary=await styles();assert(c.ordinary.theme.includes('theme-light'));assert.equal(c.ordinary.canvas,'rgb(0, 0, 0)');c.ratios={ordinary:contrast(c.ordinary.row,c.ordinary.canvas)};assert(c.ratios.ordinary>=4.5);
  await s.click('[data-record-index="2"] .rl-row');c.inspected=await styles();c.ratios.inspected=contrast(c.inspected.row,c.inspected.background);assert(c.ratios.inspected>=4.5);await button('Close record inspector');
  await s.drag('[data-record-index="2"] [data-find-source="message"]',0,14);assert.equal((await state()).selection,'row 2 upstream');assert.equal((await state()).inspected,-1);ctrl('c');
  const {native}=await import('./native-input.mjs');assert.equal(native('wl-paste',['--no-newline']),'row 2 upstream');c.selected=await styles();c.ratios.hovered=contrast(c.selected.row,c.selected.background);c.ratios.selection=contrast(c.selected.selection.color,c.selected.selection.background);assert(c.ratios.hovered>=4.5);assert(c.ratios.selection>=4.5);c.highlights=await read(`[...CSS.highlights].flatMap(([name,h])=>[...h].map(r=>({name,text:r.toString()})))`);assert(c.highlights.some(r=>r.text==='upstream'));
  const cap=await d.page.send('Page.captureScreenshot',{format:'png'});writeFileSync(`${evidence}/native-contrast-selection.png`,Buffer.from(cap.data,'base64'));
 });
}finally{
 if(ime&&ime.exitCode===null){ime.stdin.end('Q\n');await sleep(100)}s.result.imeOutput=output;
 s.result.handlerRestored=await d.main.evaluate(`(()=>{const x=global.__replacementCalls;if(!x)return true;x.ipc._invokeHandlers.set(x.channel,x.original);const ok=x.ipc._invokeHandlers.get(x.channel)===x.original;delete global.__replacementCalls;return ok})()`).catch(()=>false);await s.close();
}
