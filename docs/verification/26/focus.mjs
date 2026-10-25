// Packaged-host trusted Chromium keyboard dispatch, not physical OS-input evidence.
import {writeFileSync} from 'node:fs';
const targets=await(await fetch('http://127.0.0.1:9235/json/list')).json(),target=targets.find(t=>t.type==='page');
const socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true});});
const contexts=[],pending=new Map();let id=0;
socket.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.method==='Runtime.executionContextCreated')contexts.push(m.params.context);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}));});
let context;
const run=async expression=>{const r=await send('Runtime.evaluate',{expression,contextId:context.id,returnByValue:true,awaitPromise:true});if(r.exceptionDetails){writeFileSync('docs/verification/26/keyboard-failure.json',JSON.stringify(r,null,2)+'\n');throw Error(JSON.stringify(r.exceptionDetails));}return r.result.value;};
const press=async(key,code,n,modifiers=0)=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:n,nativeVirtualKeyCode:n,modifiers,text:key==='Enter'?'\r':undefined});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:n,nativeVirtualKeyCode:n,modifiers});await new Promise(r=>setTimeout(r,60));};
try{
 await send('Page.bringToFront');await send('Runtime.enable');context=contexts.find(c=>c.auxData?.isDefault&&c.origin.includes('770814'));if(!context)throw Error('Cluster frame absent');
 await run(`(()=>{const root=document.querySelector('.readable-logs'),c=require('electron').clipboard,hash=v=>require('crypto').createHash('sha256').update(v).digest('hex');if(root.dataset.version!=='0.1.23')throw Error('Wrong package');const formats=c.availableFormats();if(!formats.every(f=>/text|html|rtf|image|png|jpeg/i.test(f)))throw Error('Unsupported clipboard');global.__cv26Focus={root,c,hash,formats,saved:{text:c.readText(),html:c.readHTML(),rtf:c.readRTF(),image:c.readImage()},buffers:Object.fromEntries(formats.map(f=>[f,hash(c.readBuffer(f))])),pixels:hash(c.readImage().toBitmap())};[...root.querySelectorAll('button')].find(b=>b.textContent==='Find').click();c.writeText('fields');const e=root.querySelector('#rl-find');e.focus();e.select();})()`);
 await press('v','KeyV',86,2);
 const pasted=await run(`document.querySelector('#rl-find').value==='fields'`);if(!pasted)throw Error('Find paste failed');
 await press('a','KeyA',65,2);await press('c','KeyC',67,2);
 const copied=await run(`global.__cv26Focus.c.readText()==='fields'`);if(!copied)throw Error('Find copy failed');
 await press('Tab','Tab',9);await press('Tab','Tab',9,8);
 const focus=await run(`document.activeElement.id==='rl-find'`);if(!focus)throw Error('Tab/Shift+Tab failed');
 await run(`document.querySelector('.rl-row').focus()`);await press('Enter','Enter',13);
 const entered=await run(`!!document.querySelector('.rl-selected')`);if(!entered)throw Error('Row Enter failed');
 await run(`document.querySelector('[aria-label="Close record inspector"]').click();document.querySelector('.rl-row').focus()`);await press(' ','Space',32);
 const space=await run(`!!document.querySelector('.rl-selected')`);if(!space)throw Error('Row Space failed');
 writeFileSync('docs/verification/26/focus-copy-paste.json',JSON.stringify({host:'Freelens 1.10.3',version:'0.1.23',input:'Trusted CDP keyboard dispatch; physical input unverified',pasted,copied,tabAndShiftTab:focus,Enter:entered,Space:space},null,2)+'\n');
}finally{
 const restoration=await run(`(()=>{const h=global.__cv26Focus;if(!h)return {noProbe:true};const{root,c,hash}=h;c.write(h.saved);const preserved=h.formats.every(f=>c.availableFormats().includes(f))&&Object.entries(h.buffers).every(([f,v])=>f.startsWith('image/')||hash(c.readBuffer(f))===v)&&hash(c.readImage().toBitmap())===h.pixels;if(!preserved)throw Error('Clipboard restore failed');root.querySelector('[aria-label="Close record inspector"]')?.click();root.querySelector('[aria-label="Close Find"]').click();const input=root.querySelector('#rl-find');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'');input.dispatchEvent(new Event('input',{bubbles:true}));delete global.__cv26Focus;return {originalClipboardRestored:preserved,FindClosedAndEmpty:true,inspectorClosed:true,noProbe:true};})()`);
 writeFileSync('docs/verification/26/focus-copy-paste-restoration.json',JSON.stringify(restoration,null,2)+'\n');socket.close();
}
