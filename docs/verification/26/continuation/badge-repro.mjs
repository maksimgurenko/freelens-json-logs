import {connect,save,assert,tick} from './host.mjs';
const h=await connect(),results=[];let restoration;
try{
 await h.send('Page.bringToFront');await h.clipboardSave();
 await h.run(`(async()=>{const p=global.__cv26;await p.close();await p.display();await p.input('Inspection','side');await p.click('Readable');await p.display(false);p.scroll();})()`);
 for(const pointerEvents of ['auto','none','auto']){
  await h.run(`(()=>{const e=document.querySelectorAll('.rl-fields')[1];e.style.pointerEvents=${JSON.stringify(pointerEvents)};})()`);await tick(80);
  const end=await h.run(`(()=>{const b=document.querySelectorAll('.rl-row')[1].querySelector('.rl-fields').getBoundingClientRect();return {x:b.x+b.width*.98,y:b.y+Math.min(b.height,parseFloat(getComputedStyle(document.querySelector('.rl-fields')).lineHeight))/2};})()`);
  await h.drag(await h.rowPoint(1,'message',.05),{x:end.x+h.offset.x,y:end.y+h.offset.y});
  const before=await h.run(`getSelection().toString()`);await h.key('c','KeyC',67,2);
  const copy=await h.run(`(()=>{const s=require('electron').clipboard.readText();return {matches:s===getSelection().toString(),bytes:Buffer.byteLength(s),sha256:require('crypto').createHash('sha256').update(s).digest('hex')};})()`);
  results.push({pointerEvents,selection:before,copy,inspected:await h.selected()});await tick(550);
 }
}finally{await h.run(`document.querySelectorAll('.rl-fields')[1].style.removeProperty('pointer-events')`);restoration=await h.clipboardRestore();await h.close();save('badge-repro',{version:'0.1.23',input:'OS uinput pointer and Ctrl+C',results,restoration});}
assert(results.every(r=>r.selection.includes('fields')&&r.copy.matches),'Native badge endpoint loses selection');
