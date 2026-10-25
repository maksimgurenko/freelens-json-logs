// Packaged-host trusted Chromium keyboard dispatch, not physical OS-input evidence.
import {writeFileSync} from 'node:fs';
const targets=await(await fetch('http://127.0.0.1:9235/json/list')).json(),target=targets.find(t=>t.type==='page');
const socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true});});
const contexts=[],pending=new Map();let id=0;
socket.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.method==='Runtime.executionContextCreated')contexts.push(m.params.context);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}));});
let context;
const run=async expression=>{const r=await send('Runtime.evaluate',{expression,contextId:context.id,returnByValue:true,awaitPromise:true});if(r.exceptionDetails){writeFileSync('docs/verification/25/keyboard-failure.json',JSON.stringify(r,null,2)+'\n');throw Error(JSON.stringify(r.exceptionDetails));}return r.result.value;};
const press=async(key,code,n,modifiers=0)=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:n,nativeVirtualKeyCode:n,modifiers,text:key==='Enter'?'\r':undefined});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:n,nativeVirtualKeyCode:n,modifiers});await new Promise(r=>setTimeout(r,60));};
try{
 await send('Page.bringToFront');await send('Runtime.enable');context=contexts.find(c=>c.auxData?.isDefault&&c.origin.includes('770814'));if(!context)throw Error('Cluster frame absent');
 await run(`(async()=>{const h=global.__cv25;await h.select('bounded');await h.display();await h.click('Readable');await h.display(false);h.root().querySelector('[aria-label="Close record inspector"]')?.click();h.root().querySelector('[aria-controls="rl-findbar"]').focus();h.keys=[];h.keyObserver=e=>h.keys.push({key:e.key,trusted:e.isTrusted,target:e.target.tagName});document.addEventListener('keydown',h.keyObserver);})()`);
 await press('Enter','Enter',13);
 const find=await run(`(()=>{const h=global.__cv25;h.assert(!h.root().querySelector('.rl-findbar').hidden&&document.activeElement===h.root().querySelector('#rl-find'),'Keyboard Find failed');return {focused:document.activeElement.id,outline:getComputedStyle(document.activeElement).outlineWidth};})()`);
 await press('Tab','Tab',9);const tab=await run(`document.activeElement.getAttribute('aria-label')||document.activeElement.textContent`);
 await press('Tab','Tab',9,8);const shiftTab=await run(`document.activeElement.id`);
 await run(`global.__cv25.root().querySelector('.rl-display-options summary').focus()`);await press('Enter','Enter',13);
 const options=await run(`global.__cv25.root().querySelector('.rl-display-options').open`);if(!options)throw Error('Native summary activation failed');
 await run(`global.__cv25.root().querySelector('.rl-row').focus()`);await press('Enter','Enter',13);
 const inspected=await run(`!!global.__cv25.root().querySelector('.rl-detail')`);if(!inspected)throw Error('Row Enter did not inspect');
 await run(`global.__cv25.root().querySelector('[aria-label="Close record inspector"]').focus()`);await press('Enter','Enter',13);
 const closed=await run(`!global.__cv25.root().querySelector('.rl-detail')`);if(!closed)throw Error('Close Enter did not activate');
 const keys=await run(`(()=>{const h=global.__cv25;document.removeEventListener('keydown',h.keyObserver);return h.keys;})()`);
 writeFileSync('docs/verification/25/keyboard.json',JSON.stringify({host:'Freelens 1.10.3',version:'0.1.22',input:'Trusted Chromium CDP dispatch, not physical OS input',find,tab,shiftTab,options,inspected,closed,keys},null,2)+'\n');
}finally{await run(`(()=>{const h=global.__cv25;document.removeEventListener('keydown',h.keyObserver);h.root().querySelector('.rl-display-options').open=false;})()`);socket.close();}
