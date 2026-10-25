// Verification transport only. Inputs use Chromium's trusted input pipeline in
// the installed Electron renderer; this module never creates selection ranges.
import {writeFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
export const evidence='docs/verification/29/';
export function save(name,data){writeFileSync(evidence+name+'.json',JSON.stringify(data,null,2)+'\n');}
export function assert(ok,message){if(!ok)throw Error(message);}
export const tick=(ms=30)=>new Promise(resolve=>setTimeout(resolve,ms));
export async function connect(){
 const targets=await(await fetch('http://127.0.0.1:9235/json/list',{signal:AbortSignal.timeout(3000)})).json();
 const target=targets.find(t=>t.type==='page');assert(target,'No packaged host page');
 const socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
 let id=0;const pending=new Map(),contexts=[];
 socket.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.method==='Runtime.executionContextCreated')contexts.push(m.params.context);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(p){clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}}});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>{pending.delete(n);reject(Error('CDP timeout: '+method));},2500);pending.set(n,{resolve,reject,timer});socket.send(JSON.stringify({id:n,method,params}));});
 await send('Runtime.enable');
 const context=contexts.find(c=>c.auxData?.isDefault&&c.origin.includes('770814'));
 const rootContext=contexts.find(c=>c.auxData?.isDefault&&c.origin===new URL(target.url).origin);assert(context&&rootContext,'Owning host/frame contexts absent');
 const run=async(expression,ctx=context)=>{const r=await send('Runtime.evaluate',{expression,contextId:ctx.id,returnByValue:true,awaitPromise:true,includeCommandLineAPI:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const offset=await run(`(()=>{const e=[...document.querySelectorAll('iframe')].find(e=>e.src.includes('770814'));const b=e.getBoundingClientRect();return {x:b.x,y:b.y};})()`,rootContext);
 let native,playwrightBrowser,playwrightPage;
 if(process.env.CV26_PLAYWRIGHT==='1'){const{chromium}=await import('../../../.scratch/compact-view/26/browser-driver/node_modules/playwright-core/index.mjs');playwrightBrowser=await chromium.connectOverCDP('http://127.0.0.1:9235');playwrightPage=playwrightBrowser.contexts()[0].pages().find(p=>p.url()===target.url);assert(playwrightPage,'Owning Playwright page missing');playwrightPage.setDefaultTimeout(3000);}
 if(process.env.CV26_NATIVE==='1'){
  const child=spawn('/usr/bin/python3',['docs/verification/29/native-input.py'],{stdio:['pipe','pipe','inherit']});const lines=createInterface({input:child.stdout}),queued=[],waiters=[];
  lines.on('line',line=>{const value=JSON.parse(line);const waiter=waiters.shift();if(waiter)waiter(value);else queued.push(value);});
  const receive=()=>queued.length?Promise.resolve(queued.shift()):new Promise(resolve=>waiters.push(resolve));await receive();
  native=async command=>{child.stdin.write(JSON.stringify(command)+'\n');const reply=await receive();assert(reply.ok,reply.error);return reply.result;};
  native.close=async()=>{if(process.env.CV26_CURSOR_START){const p=JSON.parse(process.env.CV26_CURSOR_START);await native({op:'move',x:p.x,y:p.y});}child.stdin.end(JSON.stringify({op:'close'})+'\n');await new Promise(resolve=>child.on('exit',resolve));};
 }
 const key=async(key,code,n,modifiers=0)=>{
  if(playwrightPage){const parts=[];if(modifiers&2)parts.push('Control');if(modifiers&8)parts.push('Shift');parts.push(code==='Space'?'Space':key);await playwrightPage.keyboard.press(parts.join('+'));await tick();return;}
  if(native){const codes={Enter:28,Space:57,Tab:15,KeyC:46,KeyV:47,KeyA:30};assert(codes[code],'Unsupported native key '+code);if(modifiers&2)await native({op:'key',code:29,down:1});if(modifiers&8)await native({op:'key',code:42,down:1});await native({op:'key',code:codes[code],down:1});await native({op:'key',code:codes[code],down:0});if(modifiers&8)await native({op:'key',code:42,down:0});if(modifiers&2)await native({op:'key',code:29,down:0});await tick();return;} await send('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:n,nativeVirtualKeyCode:n,modifiers,text:key==='Enter'?'\r':undefined});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:n,nativeVirtualKeyCode:n,modifiers});await tick();};
 const point=async(expression,fraction=.5,text=false)=>{const b=await run(`(()=>{const e=${expression};if(!e)throw Error('Missing pointer target');const r=document.createRange();r.selectNodeContents(e);const b=${text?'r.getClientRects()[0]??':''}e.getBoundingClientRect();const viewport=e.closest('.rl-records')?.getBoundingClientRect();const x=e.classList.contains('rl-message')&&viewport?Math.max(viewport.left+12,Math.min(b.x+b.width*${fraction},viewport.right-24)):b.x+b.width*${fraction},y=b.y+Math.min(b.height,parseFloat(getComputedStyle(e).lineHeight)||b.height)/2,hit=document.elementFromPoint(x,y);if(!hit||!(hit===e||e.contains(hit)))throw Error('Pointer target obscured: '+e.className+' -> '+hit?.className+' at '+x+','+y);return {x,y};})()`);return {x:b.x+offset.x,y:b.y+offset.y};};
 const mouse=async(type,p,buttons=0,clickCount=1)=>{if(playwrightPage){if(type==='mouseMoved')await playwrightPage.mouse.move(p.x,p.y);else if(type==='mousePressed')await playwrightPage.mouse.down({button:'left',clickCount});else await playwrightPage.mouse.up({button:'left',clickCount});await tick(10);return;}if(native){const win=JSON.parse(process.env.CV26_WINDOW_AT);await native({op:'move',x:win.x+p.x,y:win.y+p.y});if(type==='mousePressed'||type==='mouseReleased')await native({op:'button',down:type==='mousePressed'?1:0});await tick(10);return;} await send('Input.dispatchMouseEvent',{type,...p,button:type==='mouseMoved'&&!buttons?'none':'left',buttons,...(type==='mouseMoved'?{}:{clickCount})});await tick(10);};
 const click=async(p,count=1)=>{await mouse('mouseMoved',p);await mouse('mousePressed',p,1,count);await mouse('mouseReleased',p,0,count);await tick();};
 const clickLabel=async(label)=>{const expr=`[...document.querySelector('.readable-logs').querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(label)})`;await run(`(${expr}).scrollIntoView({block:'nearest'})`);await click(await point(expr));};
 const rowPoint=(index,part='message',fraction=.5)=>point(`document.querySelectorAll('.rl-row')[${index}].querySelector('.rl-${part}')`,fraction,part==='message');
 const drag=async(a,b)=>{
  // A trusted click on inert footer text clears the previous selection through
  // Blink's normal mouse path between independent cases. No inspection/action
  // runs here; this preparation does not establish a cause for earlier failures.
  await click(await point("document.querySelector('.rl-version')"));await tick(40);await mouse('mouseMoved',a);await mouse('mousePressed',a,1);for(let i=1;i<=8;i++)await mouse('mouseMoved',{x:a.x+(b.x-a.x)*i/8,y:a.y+(b.y-a.y)*i/8},1);await mouse('mouseReleased',b);await tick();};
 const selected=()=>run(`document.querySelector('.rl-selected')?.dataset.recordIndex??null`);
 const clipboardSave=()=>run(`(()=>{if(global.__cv26Clipboard)throw Error('Clipboard snapshot already exists');const c=require('electron').clipboard,hash=v=>require('crypto').createHash('sha256').update(v).digest('hex'),formats=c.availableFormats();if(!formats.every(f=>/text|html|rtf|image|png|jpeg/i.test(f)))throw Error('Unsupported clipboard format');global.__cv26Clipboard={c,hash,formats,saved:{text:c.readText(),html:c.readHTML(),rtf:c.readRTF(),image:c.readImage()},buffers:Object.fromEntries(formats.map(f=>[f,hash(c.readBuffer(f))])),pixels:hash(c.readImage().toBitmap())};return {formats,buffers:global.__cv26Clipboard.buffers,pixels:global.__cv26Clipboard.pixels};})()`);
 const clipboardRestore=()=>run(`(()=>{const h=global.__cv26Clipboard;if(!h)return {noSnapshot:true};const{c,hash}=h;const current=c.readText(),same=Object.entries(h.buffers).every(([f,v])=>hash(c.readBuffer(f))===v);if(!same&&current!=='CV29 ordinary editing'){const buffers=Object.fromEntries(c.availableFormats().map(f=>[f,hash(c.readBuffer(f))]));delete global.__cv26Clipboard;return {newerUnownedClipboardPreserved:true,buffers};}c.write(h.saved);const formats=h.formats.every(f=>c.availableFormats().includes(f)),buffers=Object.entries(h.buffers).every(([f,v])=>f.startsWith('image/')||hash(c.readBuffer(f))===v),pixels=hash(c.readImage().toBitmap())===h.pixels;if(!formats||!buffers||!pixels)throw Error('Clipboard restoration failed');delete global.__cv26Clipboard;return {formats,buffers,pixels,restoredBuffers:Object.fromEntries(c.availableFormats().map(f=>[f,hash(c.readBuffer(f))]))};})()`);
 const close=async()=>{if(native)await native.close();if(playwrightBrowser)await playwrightBrowser.close();socket.close();for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('Transport closed'));}pending.clear();};
 return {send,run,rootRun:expression=>run(expression,rootContext),key,point,mouse,click,clickLabel,rowPoint,drag,selected,clipboardSave,clipboardRestore,close,offset};
}
