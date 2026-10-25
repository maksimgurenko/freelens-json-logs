// Minimal red-capable feedback loop: exact empty original after real row drag.
import {connect,save,assert,tick} from './host.mjs';
const h=await connect(),results=[];let restoration;
try{
 await h.send('Page.bringToFront');await h.send('Input.cancelDragging');await h.clipboardSave();
 await h.run(`(async()=>{const p=global.__cv26;await p.close();await p.display();await p.input('Inspection','side');await p.click('Raw');await p.display(false);p.scroll();})()`);
 for(const kind of ['programmatic-retained','pointer-retained','programmatic-cleared']){
  await h.run(`(async()=>{const p=global.__cv26;await p.close();p.scroll();require('electron').clipboard.writeText('ticket 26 controlled seed');})()`);
  await h.drag(await h.rowPoint(0,'message',.05),await h.rowPoint(1,'message',.95));await h.key('c','KeyC',67,2);
  await h.run(`global.__cv26.inspect(3)`);
  const selectionBefore=await h.run(`getSelection().toString().length`);assert(selectionBefore>0,'Repro has no retained row selection');
  if(kind==='programmatic-cleared')await h.run('getSelection().removeAllRanges()');
  if(kind==='pointer-retained')await h.clickLabel('Copy application text');
  else await h.run(`global.__cv26.button('Copy application text').click()`);
  const immediate=await h.run(`(()=>{const s=require('electron').clipboard.readText();return {exact:s==='',bytes:Buffer.byteLength(s),sha256:require('crypto').createHash('sha256').update(s).digest('hex'),selectionLength:getSelection().toString().length};})()`);
  await tick(100);
  const delayed=await h.run(`(()=>{const s=require('electron').clipboard.readText();return {exact:s==='',bytes:Buffer.byteLength(s),sha256:require('crypto').createHash('sha256').update(s).digest('hex')};})()`);
  results.push({kind,expectedBytes:0,selectionBefore,immediate,delayed});
 }
}finally{restoration=await h.clipboardRestore();h.close();save('copy-repro',{host:'Freelens 1.10.3',version:'0.1.23',results,restoration});}
assert(results.every(r=>r.immediate.exact&&r.delayed.exact),'Exact empty original copy failed; see hashed result');
