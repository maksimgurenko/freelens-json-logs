// Supplemental guard checks only. Forced DOM delivery is explicitly not native
// pointer evidence; physical host/dock/frame coverage is in physical-*.json.
import {writeFileSync} from 'node:fs';
import {connect,assert,tick} from './host.mjs';
const h=await connect(),out={package:'0.1.28',physical:false,checks:[]};
const history=await h.send('Page.getNavigationHistory');
try{
 out.initial=await h.run(`({focused:document.hasFocus(),url:location.href})`);
 assert(!out.initial.focused,'Run this background check while the original other app owns native focus');
 await h.run(`(() => {const root=document.querySelector('.readable-logs');global.__cv28Scope={root,focus:document.activeElement};root.querySelector('.rl-edit-profiles').click();})()`);await tick(50);
 out.unfocused=await h.run(`(() => {const root=document.querySelector('.readable-logs'),target=root.querySelector('h2');const events=[new PointerEvent('pointerdown',{button:3,buttons:8,bubbles:true,cancelable:true}),new MouseEvent('mouseup',{button:3,bubbles:true,cancelable:true}),new MouseEvent('auxclick',{button:3,bubbles:true,cancelable:true})];target.focus();for(const e of events)target.dispatchEvent(e);return {nativeDocumentFocused:document.hasFocus(),profilesRemain:!!root.querySelector('.rl-profile-editor'),canceled:events.map(e=>e.defaultPrevented)};})()`);
 assert(!out.unfocused.nativeDocumentFocused&&out.unfocused.profilesRemain&&out.unfocused.canceled.every(value=>!value),'Unfocused view claimed input');
 const previous=history.entries.find(entry=>entry.url.endsWith('/extensions'));
 assert(previous,'Real prior non-cluster host entry required');
 await h.send('Page.navigateToHistoryEntry',{entryId:previous.id});await tick(150);
 out.inactive=await h.run(`(() => {const root=document.querySelector('.readable-logs');if(!root)throw Error('No retained cached view');const before={url:location.href,visible:document.visibilityState,rects:root.getClientRects().length,profiles:!!root.querySelector('.rl-profile-editor')};const descriptor=Object.getOwnPropertyDescriptor(document,'hasFocus');try{Object.defineProperty(document,'hasFocus',{value:()=>true,configurable:true});const target=root.querySelector('h2'),events=[new PointerEvent('pointerdown',{button:3,buttons:8,bubbles:true,cancelable:true}),new MouseEvent('mouseup',{button:3,bubbles:true,cancelable:true}),new MouseEvent('auxclick',{button:3,bubbles:true,cancelable:true})];for(const e of events)target.dispatchEvent(e);return {...before,forcedDocumentFocus:true,profilesRemain:!!root.querySelector('.rl-profile-editor'),canceled:events.map(e=>e.defaultPrevented)};}finally{if(descriptor)Object.defineProperty(document,'hasFocus',descriptor);else delete document.hasFocus;}})()`);
 assert(out.inactive.profilesRemain&&out.inactive.canceled.every(value=>!value),'Inactive cached frame claimed forced input');
 out.passed=true;
}catch(error){out.failure=String(error);throw error;}
finally{
 try{
  const original=history.entries[history.currentIndex];
  await h.send('Page.navigateToHistoryEntry',{entryId:original.id});await tick(120);
  out.cleanup=await h.run(`(() => {const p=global.__cv28Scope;if(!p)return {notStarted:true};const root=document.querySelector('.readable-logs');[...root.querySelectorAll('button')].find(e=>e.textContent==='Back to logs')?.click();p.focus?.isConnected?p.focus.focus({preventScroll:true}):root.querySelector('.rl-edit-profiles').focus();delete global.__cv28Scope;return {profileClosed:!root.querySelector('.rl-profile-editor'),hasFocusOverrideRemoved:!Object.hasOwn(document,'hasFocus'),probeRemoved:!global.__cv28Scope};})()`);
  out.finalHistory=await h.send('Page.getNavigationHistory');
  assert(out.finalHistory.currentIndex===history.currentIndex&&out.finalHistory.entries.length===history.entries.length,'History not restored');
 }finally{await h.close();writeFileSync('docs/verification/28/scope.json',JSON.stringify(out,null,2)+'\n');}
}
