// One bounded installed-host case per focus/restore operation. No addRange or
// synthetic selectionchange creates the tested selections: trusted pointer
// press/move/release and multi-click delivery invoke Chromium's selection engine.
import {connect,save,assert,tick} from './host.mjs';
const [mode='Readable',layout='side']=process.argv.slice(2),h=await connect();
const out={host:'Freelens 1.10.3',version:'0.1.24',mode,layout,input:process.env.CV26_PLAYWRIGHT==='1'?'Playwright 1.64.1 trusted Chromium mouse/keyboard input in installed Electron; actual selection engine and actual clipboard; no hardware provenance claim':process.env.CV26_NATIVE==='1'?'Temporary OS uinput pointer/keyboard -> Hyprland/Wayland -> installed Electron cluster iframe; actual selection engine and Electron clipboard; no physical hardware provenance claim':'Trusted Chromium CDP Input in owning packaged cluster iframe; actual selection engine and Electron clipboard',drags:[],badges:[],activation:[],originals:[]};
let saved=false;
try{
 await h.send('Page.bringToFront');out.version=await h.run("document.querySelector('.readable-logs').dataset.version");assert(out.version==='0.1.24','Wrong installed package');
 const resetPoint=await h.point("document.querySelector('.rl-version')");
 await h.send('Input.cancelDragging');
 await h.send('Input.dispatchMouseEvent',{type:'mouseReleased',...resetPoint,button:'left',buttons:0,clickCount:1});
 if(process.env.CV26_NATIVE==='1')await h.mouse('mouseReleased',resetPoint);
 out.inputReset={cancelDragging:true,cdpLeftReleased:true,nativeLeftReleased:process.env.CV26_NATIVE==='1'};
 await h.clipboardSave();saved=true;await h.run(`(()=>{const p=global.__cv26;p.scroll=()=>{const s=p.root().querySelector('.rl-records');s.scrollTop=0;s.scrollLeft=0;s.dispatchEvent(new Event('scroll'));};})()`);
 await h.run(`(async()=>{const p=global.__cv26;await p.close();await p.display();await p.input('Inspection',${JSON.stringify(layout)});await p.click(${JSON.stringify(mode)});await p.display(false);p.scroll();getSelection().removeAllRanges();p.gestureEvents=[];p.gestureObserver=e=>{if(p.root().contains(e.target))p.gestureEvents.push({type:e.type,trusted:e.isTrusted,detail:e.detail,key:e.key,button:e.button,buttons:e.buttons,row:e.target.closest('.rl-record')?.dataset.recordIndex??null});};for(const type of ['pointerdown','pointerup','click','dblclick','keydown','copy'])document.addEventListener(type,p.gestureObserver,true);})()`);
 const copySelection=async()=>{out.selectionBeforeCopy=await h.run('getSelection().toString()');await h.key('c','KeyC',67,2);return h.run(`(()=>{const s=getSelection().toString(),c=require('electron').clipboard.readText();return {selectedText:s,clipboardExact:c===s&&!!s,actualBytes:Buffer.byteLength(c),actualSha256:require('crypto').createHash('sha256').update(c).digest('hex')};})()`);};
 for(const open of [false,true]){
  await h.run(`(async()=>{const p=global.__cv26;await p.close();if(${open})await p.inspect(14);p.scroll();getSelection().removeAllRanges();})()`);await tick(80);
  const expected=open?'14':null;
  for(const across of [false,true]){
   await h.drag(await h.rowPoint(6,'message',.05),await h.rowPoint(across?8:6,'message',.9));
   const copied=await copySelection();out.lastSelection=copied;assert(copied.clipboardExact,'Selected text/actual clipboard differ');assert(copied.selectedText.length>5,'No meaningful drag selection');
   if(across)assert(copied.selectedText.includes('row 0008')&&copied.selectedText.includes('row 0009'),'Cross-row drag missed records');
   assert(await h.selected()===expected,'Drag changed inspection');
   assert(!/\b[14] fields?\b/.test(copied.selectedText),'Badge metadata copied');
   out.drags.push({open,across,inspected:expected,...copied});
  }
  if(mode==='Readable')for(const row of [0,1]){
   await h.drag(await h.rowPoint(row,'message',.05),await h.rowPoint(row,'fields',.98));const copied=await copySelection();out.lastBadge={row,...copied};assert(copied.clipboardExact,'Badge selection/clipboard differ');
   assert(!/\b[14] fields?\b/.test(copied.selectedText),'Count badge copied');assert(copied.selectedText.includes('fields'),'Application word fields lost');assert(await h.selected()===expected,'Badge drag changed inspection');
   out.badges.push({row,label:row===0?'4 fields':'1 field',open,inspected:expected,...copied});
  }
 }
 // A first pointer click activates now; no timeout/double-click delay is used.
 await h.run(`(async()=>{const p=global.__cv26;await p.close();p.scroll();getSelection().removeAllRanges();})()`);
 const clickAt=performance.now();await h.click(await h.rowPoint(6));assert(await h.selected()==='6','Plain click did not inspect');out.activation.push({kind:'plain-click',selected:'6',observedWithinMs:performance.now()-clickAt});
 for(const [key,code,n,row] of [['Enter','Enter',13,7],[' ','Space',32,8]]){
  await h.run(`(async()=>{const p=global.__cv26;await p.close();p.scroll();p.root().querySelectorAll('.rl-row')[${row}].focus();})()`);await h.key(key,code,n);assert(await h.selected()===String(row),'Keyboard activation failed');out.activation.push({kind:code,selected:String(row)});
 }
 for(const count of [2,3]){
  await h.run(`(async()=>{const p=global.__cv26;await p.close();p.scroll();getSelection().removeAllRanges();})()`);await tick(process.env.CV26_NATIVE==='1'?550:0);const p=await h.rowPoint(6,'message',.5);
  await h.click(p,1);assert(await h.selected()==='6','First multi-click did not inspect');for(let i=2;i<=count;i++)await h.click(p,i);
  const copied=await copySelection();assert(await h.selected()==='6','Multi-click changed inspection');out.activation.push({kind:count===2?'double-click':'triple-click',firstInspected:'6',...copied});
 }
 if(mode==='Raw'){await h.run('(async()=>{const p=global.__cv26;await p.close();p.scroll();})()');await h.drag(await h.rowPoint(0,'message',.01),await h.rowPoint(1,'message',.99));const copied=await copySelection();assert(copied.clipboardExact&&copied.selectedText.includes('\"fields\":\"fields\"')&&copied.selectedText.includes('\"nested\":{\"fields\":\"value fields\"}'),'Raw original fields data lost');out.rawOriginalFields=copied;}
 // Exact-original actions use trusted pointer activation, including after a
 // multi-click selection. Seed differs from every original to catch stale reads.
 const originals=await h.run('global.__cv26.state().snapshot.records.slice(0,6).map(r=>({application:r.applicationText,transport:r.transportLine}))');
 for(let i=0;i<originals.length;i++){
  await h.run('global.__cv26.scroll()');await h.click(await h.rowPoint(i,'message',.2));assert(await h.selected()===String(i),'Original-copy record click failed');
  for(const [kind,label,copy] of [['application','Application text','Copy application text'],['transport','Transport line','Copy transport line']]){
   await h.clickLabel(label);await h.run(`require('electron').clipboard.writeText('ticket26 deliberate stale-value sentinel')`);await h.clickLabel(copy);
   const actual=await h.run(`(()=>{const s=require('electron').clipboard.readText();return {bytes:Buffer.byteLength(s),sha256:require('crypto').createHash('sha256').update(s).digest('hex')};})()`);
   const expected=await h.run(`(()=>{const s=${JSON.stringify(originals[i][kind])};return {bytes:Buffer.byteLength(s),sha256:require('crypto').createHash('sha256').update(s).digest('hex')};})()`);
   out.lastOriginalAttempt={record:i,kind,actual,expected};assert(actual.sha256===expected.sha256&&actual.bytes===expected.bytes,`Original copy differs: ${i}/${kind}`);
   await tick(100);const delayed=await h.run(`(()=>{const s=require('electron').clipboard.readText();return {bytes:Buffer.byteLength(s),sha256:require('crypto').createHash('sha256').update(s).digest('hex')};})()`);assert(delayed.sha256===expected.sha256&&delayed.bytes===expected.bytes,`Delayed original copy differs: ${i}/${kind}`);out.originals.push({record:i,kind,bytes:actual.bytes,sha256:actual.sha256,exact:true,delayedExact:true});
  }
 }
 out.events=await h.run('global.__cv26.gestureEvents');
 assert(out.events.some(e=>e.type==='pointerdown'&&e.trusted)&&out.events.some(e=>e.type==='pointerup'&&e.trusted),'No trusted gesture delivery');
 out.passed=true;
}catch(error){out.error=String(error);out.events=await h.run('global.__cv26.gestureEvents');throw error;}
finally{
 await h.send('Input.cancelDragging').catch(()=>{});
 await h.run(`(()=>{const p=global.__cv26;for(const type of ['pointerdown','pointerup','click','dblclick','keydown','copy'])document.removeEventListener(type,p.gestureObserver,true);delete p.gestureObserver;delete p.gestureEvents;getSelection().removeAllRanges();})()`);
 if(saved)out.clipboardRestored=await h.clipboardRestore();await h.close();save('gesture-'+mode.toLowerCase()+'-'+layout,out);
}
