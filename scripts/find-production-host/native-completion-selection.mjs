import {session,assert,native,sleep} from './native-completion-common.mjs';
const s=await session('native-selection-completion');const {read,state,test,button,ctrl,query,drag,reveal}=s;
async function emptyClosed(){await query('');await button('Close Find')}
async function selected(selector,text){await reveal(selector);const content=await read(`document.querySelector(${JSON.stringify(selector)}).textContent`),start=content.indexOf(text);assert(start>=0);const g=await drag(selector,start,start+text.length);assert.equal((await state()).selection,text);return g}
async function seed(selector,text,expected){await emptyClosed();const before=(await state()).inspected;await selected(selector,text);assert.equal((await state()).inspected,before,'Drag cannot activate/deselect inspector');ctrl('c');await sleep(80);assert.equal(native('wl-paste',['--no-newline']),text);ctrl('f');await s.until(x=>x.open&&x.query===expected,'Native selected-text eligibility');}
try{
 await s.navigate('surfaces');await button('Pause');await button('Display options');await s.click('.rl-display-panel label:nth-of-type(2) input');await button('Display options');
 for(const layout of ['inline','side','bottom']){
  await test('sources-'+layout,'D07/D08/D12: exact copied/seeded source text across Readable/Raw and inspector sources; labels excluded, drag preserves inspection',async c=>{
   await s.layout(layout);c.selections=[];
   // Prepare a real inspected occurrence via native click, distinct from drags.
   if((await state()).inspected!==-1)await button('Close record inspector');
   await reveal('[data-record-index="162"] .rl-row');await s.click('[data-record-index="162"] .rl-row');
   for(const [tab,text] of [['Application text','message'],['Transport line','message'],['Extracted message','Σ decoded'],['All fields','needle']]){
    await button(tab);await seed('.rl-detail pre',text,text);c.selections.push({tab,text,seed:(await state()).query,copy:native('wl-paste',['--no-newline'])});
   }
   await button('All fields');await seed('.rl-detail pre','Σ needle','');c.selections.push({tab:'All fields',text:'Σ needle',seed:'',reason:'Pretty-decoded non-source string is not an original span'});
   await button('Close record inspector');
   await seed('[data-record-index="162"] [data-find-source="message"]','Σ decoded','Σ decoded');
   await button('Display options');await button('Raw');await button('Display options');
   await seed('[data-record-index="162"] [data-find-source="application"]','message','message');
   await button('Display options');await button('Readable');await button('Display options');
  });
 }
 await test('multiline','D12: multiline actual decoded source selection is copied exactly and cannot seed empty Find',async c=>{await s.layout('side');await seed('[data-record-index="161"] [data-find-source="message"]','first\nsecond','');c.selection='first\nsecond';});
 await test('oversized','D12: selection longer than 256 code points is exact, rejected for seeding, existing query preserved',async c=>{
  const text='long '.repeat(60);await seed('[data-record-index="10"] [data-find-source="message"]',text,'');c.points=[...text].length;
  await query('prior');await button('Close Find');await selected('[data-record-index="162"] [data-find-source="message"]','Σ decoded');ctrl('f');assert.equal((await state()).query,'prior');
 });
 await test('outside-viewer','D12: actual host/sidebar selection outside viewer is ignored; existing query stays intact',async c=>{
  await emptyClosed();const sel='.main-layout-module__sidebar--suvQ_';
  // Use the real production cluster sidebar, never a foreign DOM fixture.
  c.source=await read(`(()=>{const e=[...document.querySelectorAll('a,span')].find(e=>e.textContent==='Workloads');if(!e)throw Error('Actual host sidebar source missing');e.dataset.nativeForeign='';return e.outerHTML})()`);
  await selected('[data-native-foreign]','Workloads');await button('Find');assert.equal((await state()).query,'');
  await query('prior');await button('Close Find');await selected('[data-native-foreign]','Workloads');await button('Find');assert.equal((await state()).query,'prior');
  await read(`document.querySelector('[data-native-foreign]').removeAttribute('data-native-foreign');true`);
 });
 await test('generated-label','D12: generated hidden-match label is excluded from Find seed and copy selection does not inspect',async c=>{
  await query('needle');await button('Close Find');await reveal('[data-record-index="64"] .rl-match-hint');
  const before=(await state()).inspected;await selected('[data-record-index="64"] .rl-match-hint','Match in original text');assert.equal((await state()).inspected,before);
  // Clear through Find, then make the same native label selection with empty input.
  ctrl('f');assert.equal((await state()).query,'needle');await query('');await button('Close Find');
  // Hints disappear on clear; use persistent production inspector generated heading.
  await reveal('[data-record-index="64"] .rl-row');await s.click('[data-record-index="64"] .rl-row');
  await selected('.rl-detail-head strong','Record');ctrl('f');assert.equal((await state()).query,'');
 });
 await test('selection-refresh','D07/D13: real native selection retains source nodes/offsets through actual successful HTTP refresh',async c=>{
  if((await state()).inspected!==-1)await button('Close record inspector');await emptyClosed();await selected('[data-record-index="120"] [data-find-source="message"]','needle 120');
  await read(`(()=>{const x=getSelection();globalThis.__retainNative={anchor:x.anchorNode,focus:x.focusNode,a:x.anchorOffset,f:x.focusOffset,text:x.toString()};const p=require('node:http').ClientRequest.prototype;globalThis.__httpNative={p,original:p.emit,descriptor:Object.getOwnPropertyDescriptor(p,'emit'),calls:[]};const o=__httpNative;p.emit=function(n,...a){if(n==='response'&&this.path?.includes('/pods/find-surfaces/log')){const item={path:this.path,status:a[0].statusCode,ended:false};o.calls.push(item);a[0].once('end',()=>item.ended=true)}return o.original.call(this,n,...a)};return true})()`);
  try{
   // DOM activation avoids collapsing the existing native selection on pointerdown.
   await read(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Refresh').click();true`);
   await s.until(()=>read('__httpNative.calls.some(c=>c.status===200&&c.ended)'),'Real log HTTP refresh');await sleep(100);
   c.response=await read('__httpNative.calls');c.retention=await read(`(()=>{const x=getSelection(),r=__retainNative;return {text:x.toString(),anchor:x.anchorNode===r.anchor,focus:x.focusNode===r.focus,a:x.anchorOffset===r.a,f:x.focusOffset===r.f}})()`);
   assert.deepEqual(c.retention,{text:'needle 120',anchor:true,focus:true,a:true,f:true});
  }finally{c.observerRestored=await read(`(()=>{const s=__httpNative;if(s.descriptor)Object.defineProperty(s.p,'emit',s.descriptor);else delete s.p.emit;const ok=s.p.emit===s.original;delete globalThis.__httpNative;delete globalThis.__retainNative;return ok})()`);assert(c.observerRestored)}
 });
}finally{await s.close()}
