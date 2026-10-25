import {connect,save,tick} from './host.mjs';
const h=await connect(),results=[];
try{
 await h.send('Page.bringToFront');await h.run(`(async()=>{const p=global.__cv26;await p.close();p.scroll();p.selectionEvents=[];p.selectionObserver=e=>p.selectionEvents.push({type:e.type,x:e.clientX,y:e.clientY,target:e.target.className,row:e.target.closest?.('.rl-record')?.dataset.recordIndex,selected:getSelection().toString()});for(const t of ['pointerdown','pointerup','click'])document.addEventListener(t,p.selectionObserver,true);})()`);
 for(const [row,kind] of [[1,'message'],[1,'badge'],[1,'after'],[6,'message']]){
  const a=await h.rowPoint(row,'message',.05);let b;
  if(kind==='message')b=await h.rowPoint(row,'message',.9);
  else{const p=await h.run(`(()=>{const b=document.querySelectorAll('.rl-row')[${row}].querySelector('.rl-fields').getBoundingClientRect();return {x:b.right+${kind==='after'?16:-2},y:b.y+8};})()`);b={x:p.x+h.offset.x,y:p.y+h.offset.y};}
  const expected={a,b};await h.drag(a,b);const selected=await h.run('getSelection().toString()');results.push({row,kind,expected,selected});await tick(550);
 }
}finally{const events=await h.run(`(()=>{const p=global.__cv26;for(const t of ['pointerdown','pointerup','click'])document.removeEventListener(t,p.selectionObserver,true);return p.selectionEvents;})()`);await h.close();save('selection-diagnostic',{results,events});}
