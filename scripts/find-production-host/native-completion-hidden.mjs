import {session,assert,sleep} from './native-completion-common.mjs';
import {writeFileSync} from 'node:fs';
const s=await session('native-hidden-sources');const {state,read,test,query,button}=s;
try{
 await s.navigate();await button('Pause');
 await test('hidden-original','D08: native hidden original-source action opens exact Application text, preserves active result/representation',async c=>{
  await query('needle');assert.equal((await state()).active,10);await s.reveal('[data-record-index="10"] .rl-match-hint');await s.click('[data-record-index="10"] .rl-match-hint');assert.equal((await state()).inspected,10);assert.equal((await state()).active,10);c.source=await read(`document.querySelector('.rl-detail pre').textContent`);assert.equal(c.source,'{"message": "row 10", "index": 10, "secret": "needle"}');
 });
 await test('hidden-extracted','D08: native decoded-only action in Raw opens exact Extracted message and preserves Raw/result',async c=>{
  await button('Close record inspector');await button('Display options');await button('Raw');await button('Display options');await query('payment');assert.equal((await state()).active,11);await s.reveal('[data-record-index="11"] .rl-match-hint');await s.click('[data-record-index="11"] .rl-match-hint');c.source=await read(`document.querySelector('.rl-detail pre').textContent`);assert.equal(c.source,'decoded Σ payment');assert.equal((await state()).active,11);assert(await read(`[...document.querySelectorAll('.rl-modes button')].find(e=>e.textContent==='Raw').getAttribute('aria-pressed')==='true'`));
 });
 await test('native-selection-decoration','D07: native drag and Custom Highlights coexist; active outline/inspection/focus treatments recorded for visual review',async c=>{
  await button('Close record inspector');await button('Display options');await button('Readable');await button('Display options');await query('upstream');await s.reveal('[data-record-index="2"] [data-find-source="message"]');await s.drag('[data-record-index="2"] [data-find-source="message"]',0,14);assert.equal((await state()).selection,'row 2 upstream');await sleep(80);assert.equal((await state()).active,2);assert.equal((await state()).inspected,-1);c.highlights=await read(`[...CSS.highlights].flatMap(([name,h])=>[...h].map(r=>({name,text:r.toString()})))`);assert(c.highlights.some(r=>r.text==='upstream'));
  c.styles=await read(`(()=>{const r=document.querySelector('[data-record-index="2"] .rl-row'),s=getComputedStyle(r),selection=getComputedStyle(r,'::selection');return {canvas:getComputedStyle(document.querySelector('.rl-records')).backgroundColor,rowColor:s.color,activeOutline:s.outline,selection:{background:selection.backgroundColor,color:selection.color},highlightRules:[...document.querySelectorAll('style')].map(e=>e.textContent).filter(t=>t.includes('::highlight(rl-find-'))}})()`);const cap=await s.d.page.send('Page.captureScreenshot',{format:'png'});writeFileSync('.scratch/verification/48/host/native-completion-20261028/native-selection-highlights.png',Buffer.from(cap.data,'base64'));
 });
}finally{await s.close()}
