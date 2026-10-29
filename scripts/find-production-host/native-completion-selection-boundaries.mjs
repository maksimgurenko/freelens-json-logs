import {session,assert,native,sleep} from './native-completion-common.mjs';
const s=await session('native-selection-boundaries');const {read,state,test,button,query,ctrl}=s;
try{
 await s.navigate('surfaces');await button('Pause');await button('Display options');await s.click('.rl-display-panel label:nth-of-type(2) input');await button('Display options');
 for(const n of [256,257])await test('astral-'+n,'D12: actual native '+n+'-code-point astral selection copied exactly; seed limit counts Unicode code points',async c=>{
  await query('');await button('Close Find');await s.reveal('[data-record-index="160"] [data-find-source="message"]');await s.drag('[data-record-index="160"] [data-find-source="message"]',0,n*2);const text='😀'.repeat(n);assert.equal((await state()).selection,text);ctrl('c');await sleep(50);assert.equal(native('wl-paste',['--no-newline']),text);await button('Find');await s.until(x=>x.query===(n===256?text:''),'Astral native seed limit');c.codePoints=n;c.codeUnits=text.length;
 });
 await test('multi-record','D12: native multi-record selection ignored, copied source has actual row boundaries; drag never inspects a row',async c=>{
  await query('');await button('Close Find');await s.reveal('[data-record-index="120"] .rl-row');
  const geometry=await read(`(()=>{const first=document.querySelector('[data-record-index="120"] [data-find-source="message"]'),last=document.querySelector('[data-record-index="121"] [data-find-source="message"]');const a=document.createRange(),b=document.createRange();a.selectNodeContents(first);b.selectNodeContents(last);return {start:a.getBoundingClientRect().toJSON(),end:b.getBoundingClientRect().toJSON()}})()`);
  const a=await s.point({x:geometry.start.left+.3,y:geometry.start.top+geometry.start.height/2}),b=await s.point({x:geometry.end.right-.3,y:geometry.end.top+geometry.end.height/2});await s.pointerCommand(['drag',...a,...b]);await sleep(80);c.selection=(await state()).selection;assert(c.selection.includes('needle 120')&&c.selection.includes('ordinary 121'));assert.equal((await state()).inspected,-1);await button('Find');assert.equal((await state()).query,'');
 });
}finally{await s.close()}
