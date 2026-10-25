import {connect,save,tick} from './host.mjs';
const h=await connect(),data=[];
try{
 await h.send('Page.bringToFront');await h.run(`(()=>{const p=global.__cv26;p.mouseEvents=[];p.mouseObserver=e=>p.mouseEvents.push({type:e.type,detail:e.detail,buttons:e.buttons,prevented:e.defaultPrevented,ctrl:e.ctrlKey,alt:e.altKey,shift:e.shiftKey,target:e.target.className,selection:getSelection().toString()});for(const t of ['mousedown','mouseup','mousemove'])document.addEventListener(t,p.mouseObserver,false);})()`);
 for(const row of [1,6]){
  const a=await h.rowPoint(row,'message',.1),b=await h.rowPoint(row,'message',.9);await h.run('getSelection().removeAllRanges()');await tick(100);await h.mouse('mouseMoved',a);await h.mouse('mousePressed',a,1);
  await h.mouse('mouseMoved',{x:(a.x+b.x)/2,y:a.y},1);await tick(250);const mid=await h.run('getSelection().toString()');await h.mouse('mouseMoved',b,1);const end=await h.run('getSelection().toString()');await h.mouse('mouseReleased',b);data.push({row,mid,end,after:await h.run('getSelection().toString()')});await tick(600);
 }
}finally{const events=await h.run(`(()=>{const p=global.__cv26;for(const t of ['mousedown','mouseup','mousemove'])document.removeEventListener(t,p.mouseObserver,false);return p.mouseEvents;})()`);await h.close();save('mouse-defaults',{data,events});}
