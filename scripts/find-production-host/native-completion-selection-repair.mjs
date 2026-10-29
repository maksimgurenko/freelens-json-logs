// Follow-up of preserved harness precondition failures. No failed result is erased.
import {session,assert,native,sleep} from './native-completion-common.mjs';
const s=await session('native-selection-repaired');const {read,state,test,button,ctrl,query,drag,reveal}=s;
async function select(selector,text){await reveal(selector);const content=await read(`document.querySelector(${JSON.stringify(selector)}).textContent`),start=content.indexOf(text);assert(start>=0,content);await drag(selector,start,start+text.length);assert.equal((await state()).selection,text)}
async function seed(selector,text,expected){await query('');await button('Close Find');const inspected=(await state()).inspected;await select(selector,text);assert.equal((await state()).inspected,inspected);ctrl('c');await sleep(80);assert.equal(native('wl-paste',['--no-newline']),text);await button('Find');await s.until(x=>x.open&&x.query===expected,'Expected seed')}
try{
 await s.navigate('surfaces');await button('Pause');await button('Display options');await s.click('.rl-display-panel label:nth-of-type(2) input');await button('Display options');
 await test('sources-bottom','D07/08/12: Bottom inspector sources, with actual selected interval scrolled into its clipping pane',async c=>{
  await s.layout('bottom');await reveal('[data-record-index="162"] .rl-row');await s.click('[data-record-index="162"] .rl-row');c.sources=[];
  for(const [tab,text,expected] of [['Application text','message','message'],['Transport line','message','message'],['Extracted message','Σ decoded','Σ decoded'],['All fields','needle','needle'],['All fields','Σ needle','']]){await button(tab);await seed('.rl-detail pre',text,expected);c.sources.push({tab,text,expected})}
  await button('Close record inspector');await seed('[data-record-index="162"] [data-find-source="message"]','Σ decoded','Σ decoded');
  await button('Display options');await button('Raw');await button('Display options');await seed('[data-record-index="162"] [data-find-source="application"]','message','message');await button('Display options');await button('Readable');await button('Display options');
 });
 await test('oversized','D12: native 300-code-point source selection rejected, eligible selection never overwrites prior query',async c=>{
  await s.layout('side');await seed('[data-record-index="10"] [data-find-source="message"]','long '.repeat(60),'');c.points=300;
  await query('prior');await button('Close Find');await select('[data-record-index="162"] [data-find-source="message"]','Σ decoded');ctrl('f');assert.equal((await state()).query,'prior');
 });
 await test('outside-viewer','D12: native selection from explicitly foreign non-source fixture outside viewer is ignored for empty/existing query',async c=>{
  c.precondition='A selectable foreign span adjacent to production viewer; removed in finally. Not a production editor claim.';
  await read(`(()=>{const e=document.createElement('span');e.id='native-foreign';e.textContent='foreign needle';e.style.cssText='position:fixed;top:200px;left:350px;z-index:99999;background:white;color:black;user-select:text';document.body.append(e);return true})()`);
  try{await seed('#native-foreign','foreign needle','');await query('prior');await button('Close Find');await select('#native-foreign','foreign needle');ctrl('f');assert.equal((await state()).query,'prior')}finally{await read(`document.querySelector('#native-foreign')?.remove();true`)}
 });
 await test('generated-label','D12: generated inspector heading is copied exactly, never seeds query or changes inspection',async c=>{
  await s.layout('side');await reveal('[data-record-index="64"] .rl-row');await s.click('[data-record-index="64"] .rl-row');await seed('.rl-detail-head strong','Record','');c.label='Record';
 });
}finally{await s.close()}
