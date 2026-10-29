import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { FindPosition } from '../src/core/find-state.ts';
import { FindService } from '../src/main/find-service.ts';
import { emptyWindow, replaceWindow } from '../src/core/occurrences.ts';
import { parseTransportLine } from '../src/core/records.ts';
const window=replaceWindow(emptyWindow('pr49-fixed'),Array.from({length:100},(_,i)=>parseTransportLine(`row ${i}`)));
const key=(revision:number)=>({viewerEpoch:1,targetEpoch:1,instanceEpoch:1,windowRevision:1,messageRevision:1,queryRevision:revision});
test('R1 independent control: zero-hit refinement keeps the successful origin across inspection close',()=>{
 const find=new FindPosition();find.read(window.refs[64]);find.prepare(window,key(1),'new');find.accept(key(1),[20,64,70].map(i=>window.refs[i]));
 find.prepare(window,key(2),'refine');find.accept(key(2),[]);assert.equal(find.active,undefined);
 find.closeInspection(window.refs[64]);assert.equal(find.position,window.refs[64]);assert.equal(find.candidate,window.refs[64]);
 find.prepare(window,key(3),'refine');find.accept(key(3),[20,70].map(i=>window.refs[i]));assert.equal(find.active,window.refs[70]);
});
test('R1 independent control: a new sequence discards an older candidate before pending inspector close',()=>{
 const find=new FindPosition();find.read(window.refs[64]);find.prepare(window,key(1),'new');find.accept(key(1),[window.refs[64]]);
 find.prepare(window,key(2),'new');find.closeInspection(window.refs[64]);
 assert.equal(find.position,undefined);assert.equal(find.candidate,undefined);assert.equal(find.reading,undefined);
 find.accept(key(2),[window.refs[64]]);assert.equal(find.active,undefined);
});
class Sender extends EventEmitter { mainFrame={framesInSubtree:[{processId:4,routingId:1},{processId:4,routingId:2}]};isDestroyed(){return false;} }
class Worker extends EventEmitter { stopping=false;postMessage(){}async terminate(){this.stopping=true;return 1;} }
const input={requestId:1,key:key(1),query:{text:'a',matchCase:false,wholeWords:false},records:[{ref:{context:'one',occurrence:0},application:'a'}],work:'match' as const};
const observed=['destroyed','render-process-gone','did-frame-navigate'];
for(const event of ['destroyed','render-process-gone','sibling','hash','none','service-dispose']) for(const openingCount of [1,3]) {
 test(`R2 independent listener balance: ${event}, ${openingCount} pending registration(s)`,async()=>{
  const sender=new Sender(),caller={sender,senderFrame:sender.mainFrame.framesInSubtree[0]},workers:Worker[]=[];let watch=0;
  const service=new FindService(()=>{const worker=new Worker();workers.push(worker);return worker;},'test',()=>{watch++;return()=>{watch--;};});
  try {
   const old=await service.open(caller,'viewer');const matching=service.submit(caller,old,input);
   const attempts=Array.from({length:openingCount},()=>service.open(caller,'viewer').then(token=>({ok:true,token}),error=>({ok:false,error:String(error)})));
   for(const name of observed)assert.equal(sender.listenerCount(name),openingCount,'Temporary observer count differs while final owner is retired');
   let disposing:Promise<void>|undefined;
   if(event==='sibling')sender.emit('did-frame-navigate',{},'sibling',200,'OK',false,4,2);
   else if(event==='hash')sender.emit('did-navigate-in-page',{},'#hash',true,4,1);
   else if(event==='service-dispose')disposing=service.dispose();
   else if(event!=='none')sender.emit(event);
   workers[0].emit('exit',1);await matching;const replies=await Promise.all(attempts);await disposing;
   const lost=['destroyed','render-process-gone','service-dispose'].includes(event);
   assert(replies.every(reply=>reply.ok!==lost));
   const expected=lost?0:1;
   for(const name of observed)assert.equal(sender.listenerCount(name),expected,'Temporary observer survived registration settlement');
   assert.equal(watch,expected);assert.equal((service as any).owners.size,expected);assert.equal((service as any).opening.size,0);assert.equal((service as any).retiring.size,0);
  }finally{const closing=service.dispose();for(const worker of workers)worker.emit('exit',1);await closing;}
  assert.equal(sender.eventNames().length,0);assert.equal(watch,0);
 });
}
