import {session,assert} from './native-completion-common.mjs';
const s=await session('native-host-menu-completion');const {read,state,test,query,key,ctrl,button}=s;
try{
 await s.navigate();await button('Pause');await query('upstream');
 await test('host-menu','D16: actual Freelens dock Menu owns shortcuts/Escape; closing it leaves Find open and query/result intact',async c=>{
  const before=await state();await s.click('#menu-actions-for-dock');await s.until(()=>read(`!!document.querySelector('.Menu')?.getClientRects().length`),'Actual host Menu open');
  c.menu=await read(`document.querySelector('.Menu').outerHTML`);ctrl('f');ctrl('g');assert.equal((await state()).query,before.query);assert.equal((await state()).active,before.active);
  key('-k','Escape');await s.until(()=>read(`!document.querySelector('.Menu')?.getClientRects().length`),'Host Menu closes');assert((await state()).open);assert.equal((await state()).active,before.active);
  await button('Find');key('-k','Escape');assert(!(await state()).open);
 });
 await test('shortcut-reference','D16: production shortcut transient then Find each dismiss exactly one layer and restores local opener',async c=>{
  await query('upstream');await button('Display options');await button('Shortcuts');assert(await read(`!!document.querySelector('.rl-shortcuts')`));key('-k','Escape');assert(!await read(`!!document.querySelector('.rl-shortcuts')`));assert((await state()).open);assert(await read(`document.activeElement?.matches('.rl-display-options summary')`));key('-k','Escape');assert(!(await state()).open);
 });
}finally{await s.close()}
