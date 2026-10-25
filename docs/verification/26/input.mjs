import {requireAttended} from '../../../scripts/ui-test-policy.mjs';
requireAttended();
// Earlier diagnostic driver against the packaged renderer / Electron clipboard.
// Its failed runs remain evidence; continuation/gesture-case.mjs supersedes it
// for ticket 26 acceptance. No physical hardware provenance is claimed or needed
// by ticket 26; ticket 28 separately requires physical mouse Back evidence.
import {writeFileSync} from 'node:fs';
const ev='docs/verification/26/';
const targets=await(await fetch('http://127.0.0.1:9235/json/list')).json(),target=targets.find(t=>t.type==='page');
const socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true});});
const contexts=[],pending=new Map();let id=0,context,rootContext;
socket.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.method==='Runtime.executionContextCreated')contexts.push(m.params.context);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>{pending.delete(n);reject(Error('CDP command timed out: '+method));},3000);pending.set(n,{resolve:value=>{clearTimeout(timer);resolve(value);},reject:error=>{clearTimeout(timer);reject(error);}});socket.send(JSON.stringify({id:n,method,params}));});
const run=async(expression,ctx=context)=>{const r=await send('Runtime.evaluate',{expression,contextId:ctx.id,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const tick=(ms=50)=>new Promise(r=>setTimeout(r,ms));
const assert=(ok,message)=>{if(!ok)throw Error(message);};
const key=async(key,code,n,modifiers=0)=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:n,nativeVirtualKeyCode:n,modifiers,text:key==='Enter'?'\r':key===' '?' ':undefined});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:n,nativeVirtualKeyCode:n,modifiers});await tick();};
let offset;
const point=async(index,which='message',fraction=0.5)=>{
 const r=await run(`(()=>{const h=global.__cv26,row=h.root().querySelectorAll('.rl-row')[${index}],e=${which==='badge'?'row.querySelector(".rl-fields")':'row.querySelector(".rl-message")'},r=document.createRange();r.selectNodeContents(e);const b=r.getClientRects()[0]??e.getBoundingClientRect();return {x:b.x+b.width*${fraction},y:b.y+Math.min(b.height,parseFloat(getComputedStyle(e).lineHeight))/2};})()`);
 return {x:r.x+offset.x,y:r.y+offset.y};
};
const mouse=async(type,p,buttons=0,clickCount=1)=>{await send('Input.dispatchMouseEvent',{type,...p,button:type==='mouseMoved'&&!buttons?'none':'left',buttons,clickCount});await tick(15);};
const click=async(p,count=1)=>{await mouse('mouseMoved',p);await mouse('mousePressed',p,1,count);await mouse('mouseReleased',p,0,count);await tick();};
const drag=async(a,b)=>{await run('getSelection().removeAllRanges()');await mouse('mouseMoved',a);await mouse('mousePressed',a,1);for(let i=1;i<=12;i++)await mouse('mouseMoved',{x:a.x+(b.x-a.x)*i/12,y:a.y+(b.y-a.y)*i/12},1);await mouse('mouseReleased',b);await tick();};
const selected=()=>run('global.__cv26.selected()');
const selection=()=>run('getSelection().toString()');
const result={host:'Freelens 1.10.3',version:'0.1.23',input:'Trusted Chromium CDP pointer/keyboard dispatch; NOT physical mouse/OS acceptance',drags:[],clicks:[],multiClicks:[],copies:[]};
let initialized=false;
try{
 await send('Page.bringToFront');await send('Runtime.enable');context=contexts.find(c=>c.auxData?.isDefault&&c.origin.includes('770814'));rootContext=contexts.find(c=>c.auxData?.isDefault&&c.origin===new URL(target.url).origin);assert(context&&rootContext,'Owning contexts missing');
 offset=await run(`(()=>{const e=[...document.querySelectorAll('iframe')].find(e=>e.src.includes('770814')),b=e.getBoundingClientRect();return {x:b.x,y:b.y};})()`,rootContext);
 await run(`(()=>{const h=global.__cv26,c=require('electron').clipboard,crypto=require('crypto');h.clipboard=c;h.clipboardSaved={text:c.readText(),html:c.readHTML(),rtf:c.readRTF(),image:c.readImage()};h.formats=c.availableFormats();h.assert(h.formats.every(f=>/text|html|rtf|image|png|jpeg/i.test(f)),'Unsupported clipboard format');h.originalBuffers=Object.fromEntries(h.formats.map(f=>[f,crypto.createHash('sha256').update(c.readBuffer(f)).digest('hex')]));h.originalPixels=crypto.createHash('sha256').update(c.readImage().toBitmap()).digest('hex');h.inputEvents=[];h.observe=e=>{if(h.root().contains(e.target))h.inputEvents.push({type:e.type,trusted:e.isTrusted,detail:e.detail,button:e.button,buttons:e.buttons,key:e.key,x:e.clientX,y:e.clientY,target:e.target.className,selected:h.selected()});};for(const type of ['pointerdown','pointerup','click','dblclick','keydown'])document.addEventListener(type,h.observe,true);})()`);initialized=true;
 for(const raw of [false,true]){
  await run(`(async()=>{const h=global.__cv26;await h.display();await h.click(${JSON.stringify(raw?'Raw':'Readable')});await h.display(false);})()`);
  for(const layout of ['inline','side','bottom']){
   await run(`(async()=>{const h=global.__cv26;await h.close();await h.display();await h.input('Inspection',${JSON.stringify(layout)});await h.display(false);h.scroll();})()`);
   for(const open of [false,true]){
    // A different record stays inspected; choose one below all drag ranges for Inline.
    if(open)await run('(async()=>{const h=global.__cv26;await h.inspect(14);h.scroll();})()');
    const expected=open?'14':null;
    for(const across of [false,true]){
     await drag(await point(6,'message',.05),await point(across?8:6,'message',.9));
     const text=await selection(),actual=await selected();if(across)assert(text.includes('row 0008')&&text.includes('row 0009'),'Cross-row drag did not span records');assert(text.length>5,'Drag produced no selected text');assert(actual===expected,`Drag changed inspection ${raw}/${layout}/${open}/${across}: ${actual}`);
     await key('c','KeyC',67,2);
     const copied=await run('global.__cv26.clipboard.readText()');assert(copied===text,'Actual selection clipboard differs');
     assert(!/\b[14] fields?\b/.test(copied),'Interface badge leaked into clipboard');
     result.drags.push({mode:raw?'Raw':'Readable',layout,open,across,inspected:actual,selectedText:text,clipboardExact:true});
    }
    // Dragging into the singular/plural badge cannot copy any of its generated text.
    if(!raw){for(const row of [0,1]){await drag(await point(row,'message',.05),await point(row,'badge',.99));const text=await selection();await key('c','KeyC',67,2);const copied=await run('global.__cv26.clipboard.readText()');result.lastBadge={row,text,copied};assert(text.length>3&&copied===text&&!/\b[14] fields?\b/.test(copied),'Badge copied');assert(await selected()===expected,'Badge drag changed inspection');result.copies.push({row,layout,open,text,clipboardExact:true,badgeExcluded:true});}}
    await run('getSelection().removeAllRanges()');
   }
   await run('(async()=>{const h=global.__cv26;await h.close();h.scroll();})()');
   // Single click without a delay opens inspection before the next render opportunity.
   const start=performance.now();await click(await point(6));assert(await selected()==='6','Normal click did not inspect');result.clicks.push({mode:raw?'Raw':'Readable',layout,index:6,observedWithinMs:performance.now()-start});
   await run('(async()=>{const h=global.__cv26;await h.close();h.scroll();h.root().querySelectorAll(".rl-row")[7].focus();})()');await key('Enter','Enter',13);assert(await selected()==='7','Enter did not inspect');
   await run('(async()=>{const h=global.__cv26;await h.close();h.scroll();h.root().querySelectorAll(".rl-row")[8].focus();})()');await key(' ','Space',32);assert(await selected()==='8','Space did not inspect');
   for(const count of [2,3]){
    await run('(async()=>{const h=global.__cv26;await h.close();h.scroll();getSelection().removeAllRanges();})()');
    const p=await point(6,'message',.5);
    await click(p,1);const first=await selected();assert(first==='6','First multi-click did not inspect');
    for(let i=2;i<=count;i++)await click(p,i);
    const text=await selection();assert(text.length>0,'Multi-click selection missing');assert(await selected()==='6','Multi-click changed first inspection');result.multiClicks.push({mode:raw?'Raw':'Readable',layout,count,firstInspected:first,selection:text});
   }
  }
 }
 // Keep all original JSON/application content selectable and copied faithfully.
 await run('(async()=>{const h=global.__cv26;await h.close();await h.display();await h.click("Raw");await h.display(false);h.scroll();})()');
 await drag(await point(0,'message',0),await point(1,'message',1));await key('c','KeyC',67,2);
 const rawText=await run('global.__cv26.clipboard.readText()');assert(rawText.includes('"fields":"fields"')&&rawText.includes('"nested":{"fields":"value fields"}'),'Raw fields keys/values lost');result.rawOriginalFields={copied:rawText,keysAndValuesIntact:true};
 await run('getSelection().removeAllRanges()');
 const originals=await run('global.__cv26.state().snapshot.records.slice(0,6).map(r=>({application:r.applicationText,transport:r.transportLine}))');
 for(let i=0;i<originals.length;i++){
  await run(`global.__cv26.inspect(${i})`);
  for(const [kind,label,copy] of [['application','Application text','Copy application text'],['transport','Transport line','Copy transport line']]){
   await run(`(async()=>{const h=global.__cv26;await h.click(${JSON.stringify(label)});await h.click(${JSON.stringify(copy)});})()`);
   const actual=await run('global.__cv26.clipboard.readText()');result.lastOriginal={index:i,kind,exact:actual===originals[i][kind],selected:await selected()};assert(actual===originals[i][kind],'Exact copy action changed original');result.copies.push({originalRecord:i,kind,bytes:Buffer.byteLength(actual),exact:true});
  }
 }
 await run('(async()=>{const h=global.__cv26;await h.click("Find");h.clipboard.writeText("fields");const input=h.root().querySelector("#rl-find");input.focus();input.select();})()');await key('v','KeyV',86,2);assert(await run('global.__cv26.root().querySelector("#rl-find").value')==='fields','Native paste into owned input failed');await key('Tab','Tab',9);const tab=await run('document.activeElement.textContent');await key('Tab','Tab',9,8);assert(await run('document.activeElement.id')==='rl-find','Shift+Tab focus failed');result.keyboard={Enter:true,Space:true,paste:true,tab,shiftTabReturnsToFind:true};
 result.events=await run('global.__cv26.inputEvents');
}catch(error){await send('Input.cancelDragging').catch(()=>{});result.error=String(error);result.events=await run('global.__cv26.inputEvents');result.frameOffset=offset;writeFileSync(ev+'preliminary-input-failure.json',JSON.stringify(result,null,2)+'\n');throw error;}
finally{
 if(initialized){result.restoration=await run(`(()=>{const h=global.__cv26,c=h.clipboard,crypto=require('crypto');for(const type of ['pointerdown','pointerup','click','dblclick','keydown'])document.removeEventListener(type,h.observe,true);c.write(h.clipboardSaved);const buffers=Object.fromEntries(c.availableFormats().map(f=>[f,crypto.createHash('sha256').update(c.readBuffer(f)).digest('hex')]));const formats=h.formats.every(f=>c.availableFormats().includes(f)),nonImage=Object.entries(h.originalBuffers).every(([f,hash])=>f.startsWith('image/')||buffers[f]===hash),pixels=crypto.createHash('sha256').update(c.readImage().toBitmap()).digest('hex')===h.originalPixels;h.assert(formats&&nonImage&&pixels,'Clipboard restoration failed');delete h.clipboardSaved;getSelection().removeAllRanges();return {originalFormatsRestored:formats,nonImageBuffersEqual:nonImage,imagePixelsEqual:pixels,observerRemoved:true};})()`);}
 socket.close();
 writeFileSync(ev+(result.error?'input-failed-finally.json':'input.json'),JSON.stringify(result,null,2)+'\n');
}
