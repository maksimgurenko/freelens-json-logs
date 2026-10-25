import {writeFileSync} from 'node:fs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {connect, assert, tick} from './host.mjs';
const h=await connect(), out={package:'0.1.28', physical:false, checks:[]};
const native=promisify(execFile);
const check=async(name,expression)=>{const result=await h.run(expression);out.checks.push({name,result});assert(result,name);};
const input=(label,value)=>h.run(`(() => {const selector='[aria-label="'+${JSON.stringify(label)}+'"]';const e=document.querySelector('input'+selector+',select'+selector+',textarea'+selector);e.focus({preventScroll:true});const proto=e.tagName==='SELECT'?HTMLSelectElement.prototype:e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`);
const click=text=>h.clickLabel(text);
const back=async expression=>{
 const p=await h.point(expression);await h.send('Input.dispatchMouseEvent',{type:'mouseMoved',...p});
 await h.send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'back',buttons:8,clickCount:1});
 await h.send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'back',buttons:0,clickCount:1});await tick(80);
};
try{
 await h.send('Page.bringToFront');
 out.beforeHistory=await h.send('Page.getNavigationHistory');
 await h.run(`(() => {if(global.__cv28Matrix)throw Error('Matrix already installed');const root=document.querySelector('.readable-logs');if(root.dataset.version!=='0.1.28')throw Error('Wrong package');let f=root[Object.keys(root).find(k=>k.startsWith('__reactFiber$'))];while(f&&!f.memoizedProps?.preferences)f=f.return;const preferences=f.memoizedProps.preferences;global.__cv28Matrix={preferences,original:structuredClone(preferences.read().configuration),owned:[],url:location.href,history:history.length};[...root.querySelectorAll('button')].find(e=>e.textContent==='Pause')?.click();})()`);
 await click('Find');await input('Find in logs','CV28 retained matrix query');
 out.initialFind=await h.run(`({hidden:document.querySelector('.rl-findbar').hidden,query:document.querySelector('#rl-find').value})`);
 assert(!out.initialFind.hidden,'Find must actually be visible before the matrix');
 await h.run(`document.querySelector('.rl-row').click()`);
 await click('Edit profiles');
 for(const name of ['CV28 matrix first','CV28 matrix second']){
  await click('Duplicate');await input('Profile name',name);await click('Save profile');
  await h.run(`global.__cv28Matrix.owned.push(document.querySelector('[aria-label="Saved profile"]').value)`);
 }
 await input('Global default',await h.run('global.__cv28Matrix.owned[1]'));
 await h.run(`document.querySelector('[aria-label="Move CV28 matrix second up"]').click()`);
 await h.run(`global.__cv28Matrix.saved=structuredClone(global.__cv28Matrix.preferences.read().configuration)`);
 await click('Edit');await input('Profile name','CV28 matrix unfinished draft');
 await back(`document.querySelector('[aria-label="Profile name"]')`);
 out.beforeDuplicate=await h.run(`({findHidden:document.querySelector('.rl-findbar').hidden,selected:!!document.querySelector('.rl-selected'),profiles:!!document.querySelector('.rl-profile-editor'),url:location.href,history:history.length})`);
 await check('Mouse Back retains saved profiles/default/order, query and inspected original; discards only draft',`(() => {const p=global.__cv28Matrix,r=document.querySelector('.readable-logs');return !r.querySelector('.rl-profile-editor')&&JSON.stringify(p.preferences.read().configuration)===JSON.stringify(p.saved)&&r.querySelector('#rl-find').value==='CV28 retained matrix query'&&!!r.querySelector('.rl-selected')&&!![...r.querySelectorAll('button')].find(e=>e.textContent==='Resume')&&location.href===p.url&&history.length===p.history;})()`);
 await h.run(`(() => {const root=document.querySelector('.readable-logs');const e=new MouseEvent('auxclick',{button:3,bubbles:true,cancelable:true});root.querySelector('.rl-edit-profiles').dispatchEvent(e);global.__cv28Matrix.duplicateCanceled=e.defaultPrevented;})()`);
 out.duplicateReleaseCanceled=await h.run('global.__cv28Matrix.duplicateCanceled');
 out.afterDuplicate=await h.run(`({findHidden:document.querySelector('.rl-findbar').hidden,selected:!!document.querySelector('.rl-selected'),profiles:!!document.querySelector('.rl-profile-editor'),url:location.href,expectedUrl:global.__cv28Matrix.url,history:history.length,expectedHistory:global.__cv28Matrix.history})`);
 assert(out.afterDuplicate.findHidden===out.beforeDuplicate.findHidden&&out.afterDuplicate.selected===out.beforeDuplicate.selected&&out.afterDuplicate.profiles===out.beforeDuplicate.profiles&&out.afterDuplicate.url===out.beforeDuplicate.url&&out.afterDuplicate.history===out.beforeDuplicate.history,'Duplicate release changed local/host state');
 out.checks.push({name:'Supplemental duplicate release leaves all local/host state unchanged',result:true});
 await click('Edit profiles');
 await check('Reopen starts from saved state; no unfinished draft returns',`document.querySelector('[aria-label="Profile name"]').disabled&&!document.body.textContent.includes('CV28 matrix unfinished draft')`);
 await click('Duplicate');await input('Profile name','CV28 native history unsaved');
 await h.run(`global.__cv28Matrix.oldRoot=document.querySelector('.readable-logs');global.__cv28Matrix.listenersBefore=Object.fromEntries(Object.entries(getEventListeners(global.__cv28Matrix.oldRoot)).map(([type,ls])=>[type,ls.length]));`);
 // Native Freelens accelerator: input through the trusted key pipeline, not a
 // local history helper. It must leave Profiles instead of invoking local Back.
 out.nativeBack=JSON.parse((await native('/usr/bin/python3',['docs/verification/28/native-combination.py','back'])).stdout);await tick(200);
 await check('Native Ctrl+[ retains host Back ownership from dirty Profiles',`location.href!==global.__cv28Matrix.url&&!document.querySelector('.readable-logs')`);
 out.afterNativeBack=await h.send('Page.getNavigationHistory');
 out.teardown=await h.run(`(() => {const ls=getEventListeners(global.__cv28Matrix.oldRoot),count=type=>(ls[type]??[]).length;return {before:global.__cv28Matrix.listenersBefore,after:{pointerdown:count('pointerdown'),mouseup:count('mouseup'),auxclick:count('auxclick'),pointercancel:count('pointercancel'),pointerleave:count('pointerleave')}};})()`);
 assert(out.teardown.after.auxclick===0&&out.teardown.after.mouseup===0&&out.teardown.after.pointercancel===0&&out.teardown.after.pointerleave===0,'Back listeners survived unmount');
 out.nativeForward=JSON.parse((await native('/usr/bin/python3',['docs/verification/28/native-combination.py','forward'])).stdout);await tick(200);
 await check('Native Ctrl+] restores the saved view without resurrecting local drafts or Find/inspection history layers',`location.href===global.__cv28Matrix.url&&!!document.querySelector('.readable-logs')&&!document.querySelector('.rl-profile-editor')&&!document.querySelector('.rl-selected')&&document.querySelector('.rl-findbar').hidden&&document.querySelector('#rl-find').value===''`);
 out.afterNativeForward=await h.send('Page.getNavigationHistory');
 await click('Edit profiles');
 await check('Saved profile/default/order changes survive host Back and Forward',`JSON.stringify(global.__cv28Matrix.preferences.read().configuration)===JSON.stringify(global.__cv28Matrix.saved)`);
 out.passed=true;
}catch(error){out.failure=String(error);throw error;}
finally{
 try{
  if(out.beforeHistory){const now=await h.send('Page.getNavigationHistory');if(now.currentIndex!==out.beforeHistory.currentIndex){await h.send('Page.navigateToHistoryEntry',{entryId:out.beforeHistory.entries[out.beforeHistory.currentIndex].id});await tick(200);}}
  out.cleanup=await h.run(`(() => {const p=global.__cv28Matrix;if(!p)return {notStarted:true};const root=document.querySelector('.readable-logs');if(!root)throw Error('Viewer absent during cleanup');[...root.querySelectorAll('button')].find(e=>e.textContent==='Back to logs')?.click();root.querySelector('[aria-label="Close record inspector"]')?.click();root.querySelector('[aria-label="Close Find"]')?.click();const e=root.querySelector('#rl-find');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'');e.dispatchEvent(new Event('input',{bubbles:true}));for(const id of p.owned)p.preferences.deleteProfile(id);p.preferences.setGlobalDefault(p.original.globalDefault);const config=p.preferences.read().configuration;if(JSON.stringify(config)!==JSON.stringify(p.original))throw Error('Original configuration differs');[...root.querySelectorAll('button')].find(e=>e.textContent==='Pause')?.click();root.querySelector('.rl-edit-profiles').focus();delete global.__cv28Matrix;return {originalConfigurationRestored:true,ownedProfilesRemoved:true,probeRemoved:true};})()`);
 }finally{await h.close();writeFileSync('docs/verification/28/state-matrix.json',JSON.stringify(out,null,2)+'\n');}
}
