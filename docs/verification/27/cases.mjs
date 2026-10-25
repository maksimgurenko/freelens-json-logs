import {connect,save,assert,tick} from './host.mjs';
const kind=process.argv[2],h=await connect(),out={host:'Freelens 1.10.3',package:'0.1.26',case:kind,input:'Playwright trusted Chromium input in actual Electron; no physical hardware claim',checks:[]};
const run=h.run,check=async(name,expression)=>{const result=await run(expression);out.checks.push({name,result});assert(result,name);};
const click=label=>h.clickLabel(label),escape=()=>h.key('Escape','Escape',27),focus=selector=>run(`global.__cv27.focus(${JSON.stringify(selector)})`);
const input=(label,value)=>run(`global.__cv27.input(${JSON.stringify(label)},${JSON.stringify(value)})`);
try{
 await h.send('Page.bringToFront');
 await run(`(()=>{const p=global.__cv27;p.events=[];p.eventListener=e=>p.events.push({key:e.key,code:e.code,repeat:e.repeat,composing:e.isComposing,trusted:e.isTrusted,target:e.target.tagName});document.addEventListener('keydown',p.eventListener,true);p.startHistory=history.length;p.startUrl=location.href;})()`);
 if(kind==='profiles'){
  await run(`global.__cv27.close()`);await click('Find');await check('Find actually opens before state preparation',`!document.querySelector('.rl-findbar').hidden`);await input('Find in logs','fields');await run(`(()=>{const p=global.__cv27;p.root().querySelectorAll('.rl-row')[20].click();p.root().querySelector('.rl-records').scrollTop=407;})()`);await tick(80);
  await run(`global.__cv27.before=global.__cv27.summary()`);await click('Edit profiles');await click('Duplicate');await input('Profile name','CV27 first');await click('Save profile');
  await click('Duplicate');await input('Profile name','CV27 second');await click('Save profile');
  await run(`(async()=>{const p=global.__cv27,id=p.config().profiles.find(p=>p.name==='CV27 second').id;await p.input('Global default',id);p.root().querySelector('[aria-label="Move CV27 second up"]').click();p.saved=structuredClone(p.config());})()`);
  await click('Edit');await input('Profile name','CV27 unfinished');await focus('[aria-label="Message paths"]');await escape();
  await check('Escape from draft returns, preserving query/selection/viewport and saved configuration',`(()=>{const p=global.__cv27,s=p.summary(),b=p.before;return !s.profiles&&s.query===b.query&&s.find===b.find&&s.selected===b.selected&&Math.abs(s.top-b.top)<1&&s.paused===b.paused&&JSON.stringify(p.config())===JSON.stringify(p.saved)&&document.activeElement===p.root().querySelector('.rl-edit-profiles');})()`);
  await h.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27,autoRepeat:true});await h.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await check('Held Escape does not dismiss next Find layer',`!global.__cv27.root().querySelector('.rl-findbar').hidden`);
  await click('Edit profiles');await check('Reopening never resurrects unfinished draft',`document.querySelector('[aria-label="Profile name"]').disabled&&!document.body.textContent.includes('CV27 unfinished')`);
  await input('Saved profile',await run(`global.__cv27.config().profiles.find(p=>p.name==='CV27 first').id`));await click('Delete');await check('Delete confirmation focuses Keep profile',`document.activeElement.textContent==='Keep profile'`);await escape();
  await check('Delete Escape cancels only confirmation and restores Delete focus',`!!document.querySelector('.rl-profile-editor')&&!global.__cv27.button('Keep profile')&&document.activeElement.textContent==='Delete'`);
  await click('Delete');await click('Keep profile');await check('Visible Keep uses same transition',`document.activeElement.textContent==='Delete'&&!!document.querySelector('.rl-profile-editor')`);
  await click('Edit');await input('Profile name','CV27 cancel draft');await click('Cancel draft');await check('Explicit Cancel draft stays in Profiles and discards',`!!document.querySelector('.rl-profile-editor')&&document.querySelector('[aria-label="Profile name"]').disabled`);
  await click('Edit');await input('Profile name','CV27 visible discard');await click('Back to logs');await check('Visible Back discards only draft',`!document.querySelector('.rl-profile-editor')&&JSON.stringify(global.__cv27.config())===JSON.stringify(global.__cv27.saved)`);
  await click('Edit profiles');await escape();await check('Profiles Escape without draft returns',`!document.querySelector('.rl-profile-editor')`);
 }
 if(kind==='logs'){
  await run(`global.__cv27.close()`);
  for(const layout of ['inline','side','bottom']){
   await run(`(async()=>{const p=global.__cv27;await p.display();await p.input('Inspection',${JSON.stringify(layout)});await p.display(false);const row=p.root().querySelectorAll('.rl-row')[22];row.click();row.focus({preventScroll:true});})()`);
   await click('Find');await input('Find in logs','fields');await escape();
   await check(layout+': Escape Find retains query, inspector and returns opener',`(()=>{const p=global.__cv27;return p.root().querySelector('.rl-findbar').hidden&&p.find().value==='fields'&&!!p.root().querySelector('.rl-detail')&&document.activeElement.textContent==='Find';})()`);
   await escape();await check(layout+': subsequent Escape closes inspector, returns retained row',`!document.querySelector('.rl-detail')&&document.activeElement===document.querySelectorAll('.rl-row')[22]`);
   await escape();await check(layout+': bare logs do not navigate',`location.href===global.__cv27.startUrl&&!document.querySelector('.rl-profile-editor')`);
   await run(`global.__cv27.root().querySelectorAll('.rl-row')[23].click()`);await click('Find');await h.click(await h.point(`document.querySelector('[aria-label="Close Find"]')`));await h.click(await h.point(`document.querySelector('[aria-label="Close record inspector"]')`));
   await check(layout+': visible close restores row and preserves query',`document.activeElement===document.querySelectorAll('.rl-row')[23]&&document.querySelector('#rl-find').value==='fields'`);
  }
  await click('Find');await h.key('Tab','Tab',9);await h.key('Tab','Tab',9,8);await check('Tab/Shift+Tab remain available',`document.activeElement.id==='rl-find'`);
 }
 if(kind==='transient'){
  await run(`global.__cv27.close()`);await click('Edit profiles');await focus('h2');
  await h.click(await h.point(`document.querySelector('.new-dock-tab')`));await tick(150);
  out.menuBefore=await run(`({menus:[...document.querySelectorAll('.Menu')].map(n=>n.textContent),focus:document.activeElement.tagName,local:!!document.querySelector('.rl-profile-editor')})`);
  assert(out.menuBefore.menus.length,'No real host capture Menu');
  // Refocus ordinary local field while the real host Menu remains open. It does
  // not auto-focus; this reproduces its earlier capture-only Escape behavior.
  await focus('h2');await escape();await tick(180);
  await check('Earlier real host capture closes Menu, same Escape does not leave Profiles',`!document.querySelector('.Menu')&&!!document.querySelector('.rl-profile-editor')`);
  await escape();await check('Next Escape returns after host menu is gone',`!document.querySelector('.rl-profile-editor')`);
  await click('Find');await run(`document.querySelectorAll('.rl-row')[20].click()`);
  await h.click(await h.point(`document.querySelector('.rl-display-options > summary')`));await escape();
  await check('Display disclosure closes before Find/inspection',`!document.querySelector('.rl-display-options').open&&!document.querySelector('.rl-findbar').hidden&&!!document.querySelector('.rl-detail')`);
  await h.click(await h.point(`document.querySelector('.rl-target-context > summary')`));await escape();
  await check('Target disclosure closes before Find',`!document.querySelector('.rl-target-context').open&&!document.querySelector('.rl-findbar').hidden`);
  await run(`global.__cv27.close()`);await click('Edit profiles');
  await h.click(await h.point(`document.querySelector('[aria-label="Saved profile"]')`));await tick(100);
  out.nativeSelectOpen=await run(`document.querySelector('[aria-label="Saved profile"]').matches(':open')`);assert(out.nativeSelectOpen,'Native select popup not open');
  const n=await run('global.__cv27.events.length');await escape();await tick(100);
  out.nativeSelectEscapeEvents=await run(`global.__cv27.events.slice(${n})`);
  await check('Native select Escape closes only popup',`!document.querySelector('[aria-label="Saved profile"]').matches(':open')&&!!document.querySelector('.rl-profile-editor')`);
  await escape();await check('Next Escape from closed select returns',`!document.querySelector('.rl-profile-editor')`);
 }
 if(kind==='scope'){
  await run(`global.__cv27.close()`);await click('Edit profiles');
  await run(`(()=>{const e=document.querySelector('.Dock input')??document.querySelector('.Dock [tabindex]');if(!e)throw Error('No native dock focus target');e.focus();})()`);await escape();
  await check('Native dock owns Escape while Profiles remains',`!!document.querySelector('.rl-profile-editor')`);
  await focus('h2');await h.key('Escape','Escape',27,8);await check('Shift+Escape has no local dismissal',`!!document.querySelector('.rl-profile-editor')`);
  // Supplemental composition guard only; this does not establish OS IME delivery.
  await run(`document.activeElement.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true,data:'あ'}))`);await escape();await check('Composition ownership suppresses local dismissal (supplemental event)',`!!document.querySelector('.rl-profile-editor')`);await run(`document.activeElement.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'あ'}))`);await escape();
  await check('Composition completion releases Escape',`!document.querySelector('.rl-profile-editor')`);
 }
 await check('All local transitions preserve host URL/history',`history.length===global.__cv27.startHistory&&location.href===global.__cv27.startUrl`);out.passed=true;
}catch(error){out.failure=String(error);throw error;}
finally{out.final=await run(`global.__cv27.summary()`);out.events=await run(`(()=>{const p=global.__cv27;document.removeEventListener('keydown',p.eventListener,true);return p.events;})()`);await h.close();save('case-'+kind,out);}
