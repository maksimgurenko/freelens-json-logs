// Expected behavior regressions for confirmed PR #49 claims; unchanged production code.
import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { FindPosition, type FindEdit } from '../src/core/find-state.ts';
import { FindService } from '../src/main/find-service.ts';
import { matchingRecords } from '../src/core/find-matcher.ts';
import { emptyWindow, replaceWindow, recordIndex } from '../src/core/occurrences.ts';
import { parseTransportLine } from '../src/core/records.ts';
const window = replaceWindow(emptyWindow('pr49'), Array.from({length:100},(_,i)=>parseTransportLine(i===64?'up':[20,70].includes(i)?'upstream':'other')));
const key = (revision: number) => ({ viewerEpoch:1,targetEpoch:1,instanceEpoch:1,windowRevision:1,messageRevision:1,queryRevision:revision });
const evaluate = (find: FindPosition, text: string, revision: number, edit: FindEdit) => {
  find.prepare(window,key(revision),edit);
  find.accept(key(revision),matchingRecords(window.records.map((record,i)=>({ref:window.refs[i],application:record.applicationText})),{text,matchCase:false,wholeWords:false}).map(record=>record.ref));
};
test('R1: inspector close preserves the successful search position for a later nonmatching refinement',()=>{
  const find=new FindPosition(); find.read(window.refs[64]); evaluate(find,'up',1,'new');
  find.closeInspection(window.refs[64]);
  assert.equal(find.reading,undefined); assert.equal(find.active,window.refs[64]); assert.equal(find.candidate,window.refs[64]);
  evaluate(find,'ups',2,'refine'); assert.equal(recordIndex(window,find.active),70);
});
test('R1 control: close clears a reading-only origin without promoting a pending result',()=>{
  const find=new FindPosition(); find.read(window.refs[64]); find.prepare(window,key(1),'new');
  find.closeInspection(window.refs[64]);
  assert.equal(find.position,undefined); assert.equal(find.reading,undefined);
  find.accept(key(1),[window.refs[64]]); assert.equal(find.active,undefined);
});
test('R1 control: closing a different reading row preserves an independent search position',()=>{
  const find=new FindPosition(); find.read(window.refs[64]); evaluate(find,'up',1,'new'); find.navigate(1);
  find.closeInspection(window.refs[64]); assert.equal(find.position,window.refs[70]);
  evaluate(find,'ups',2,'refine'); assert.equal(recordIndex(window,find.active),70);
});
class Sender extends EventEmitter {
  mainFrame={framesInSubtree:[{processId:4,routingId:1},{processId:4,routingId:2}]};
  isDestroyed(){return false;}
}
class Worker extends EventEmitter { stopping=false; postMessage(){} async terminate(){this.stopping=true;return 1;} }
const input={requestId:1,key:key(1),query:{text:'a',matchCase:false,wholeWords:false},records:[{ref:{context:'one',occurrence:0},application:'a'}],work:'match' as const};
async function registration({navigate=false,mutable=false,sibling=false,inPage=false,sameIds=false}={}){
  const sender=new Sender(), frame=sender.mainFrame.framesInSubtree[0];
  const workers:Worker[]=[];let watches=0;
  const service=new FindService(()=>{const worker=new Worker();workers.push(worker);return worker;},'test',()=>{watches++;return()=>{watches--;};});
  const caller={sender,senderFrame:frame};
  if(sibling)await service.open({sender,senderFrame:sender.mainFrame.framesInSubtree[1]},'independent');
  const old=await service.open(caller,'viewer');const match=service.submit(caller,old,input);
  const opening=service.open(caller,'viewer').then(token=>({ok:true,token}),error=>({ok:false,error:String(error)}));
  assert(workers[0].stopping);
  if(navigate){
    if(sameIds){} // Reviewer model: keep numeric identity; no actual runtime coverage claimed.
    else if(mutable)frame.routingId=8; // Electron WebFrameMain retargeting, measured in real IPC fixture.
    else sender.mainFrame.framesInSubtree[0]={processId:4,routingId:8};
    sender.emit('did-frame-navigate',{},'http://same-origin/new',200,'OK',true,4,sameIds?1:8);
  } else if(inPage)sender.emit('did-navigate-in-page',{},'http://same-origin/#hash',true,4,1);
  workers[0].emit('exit',1);const result=await opening;await match;
  const remains={owners:(service as any).owners.size,watches};
  await service.dispose(); assert.equal(sender.eventNames().length,0);assert.equal(watches,0);
  return {result,remains};
}
test('R2: departed document cannot finish pending open through a retargeted WebFrameMain',async()=>{
  const {result,remains}=await registration({navigate:true,mutable:true});
  assert.equal(result.ok,false);assert.equal(remains.owners,0);assert.equal(remains.watches,0);
});
test('R2: a sibling owner keeping navigation listeners alive does not authorize a pending old document',async()=>{
  const {result,remains}=await registration({navigate:true,mutable:true,sibling:true});
  assert.equal(result.ok,false);assert.equal(remains.owners,1);assert.equal(remains.watches,1);
});
test('R2 control: immutable old numeric identity absent from the frame tree is rejected',async()=>{
  const {result,remains}=await registration({navigate:true});assert.equal(result.ok,false);assert.equal(remains.owners,0);
});
test('R2 control: no navigation and in-page navigation keep the same live document',async()=>{
  for(const inPage of [false,true]){const {result,remains}=await registration({inPage});assert.equal(result.ok,true);assert.equal(remains.owners,1);}
});

test('R2 model: same-ID document navigation also invalidates an in-flight registration',async()=>{
  const {result,remains}=await registration({navigate:true,sameIds:true});assert.equal(result.ok,false);assert.equal(remains.owners,0);
});
