import {session,assert} from './native-completion-common.mjs';
const s=await session('native-final-edges');const {state,read,test,button,query,ctrl,key}=s;
try{
 await s.navigate();await button('Pause');await query('upstream');
 await test('vanished-opener','D02/D14/D16: actually open closed Find from inspector tab, remove that opener natively, Escape uses viewport fallback without reanchoring/jump',async c=>{
  await s.reveal('[data-record-index="2"] .rl-row');await s.click('[data-record-index="2"] .rl-row');await button('Close Find');await button('Application text');c.opener=await read(`document.activeElement.outerHTML`);ctrl('f');await button('Close record inspector');const before=await state();key('-k','Escape');assert(!(await state()).open);assert(await read(`document.activeElement?.matches('.rl-records')`));assert.equal((await state()).scroll,before.scroll);assert.equal((await state()).update,'Paused');
 });
 await test('host-menu','D16: actual Freelens dock Menu owns shortcuts and single Escape; Find stays open with result unchanged',async c=>{
  await query('upstream');const before=await state();await s.click('#menu-actions-for-dock');await s.until(()=>read(`!!document.querySelector('.Menu')?.getClientRects().length`),'Native host Menu');c.menu=await read(`document.querySelector('.Menu').outerHTML`);ctrl('f');ctrl('g');assert.equal((await state()).query,before.query);assert.equal((await state()).active,before.active);key('-k','Escape');await s.until(()=>read(`!document.querySelector('.Menu')?.getClientRects().length`),'Menu Escape');assert((await state()).open);assert.equal((await state()).active,before.active);await button('Find');key('-k','Escape');assert(!(await state()).open);
 });
}finally{await s.close()}
