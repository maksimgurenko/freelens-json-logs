import {requireAttended} from '../../../scripts/ui-test-policy.mjs';
// OS delivery through an owned temporary uinput keyboard, never a physical claim.
import {spawn,execFileSync} from 'node:child_process';
import {createInterface} from 'node:readline';
import {assert,tick} from './host.mjs';
export async function nativeKeyboard(){
 requireAttended();
 const child=spawn('/usr/bin/python3',['docs/verification/30/native-input.py'],{stdio:['pipe','pipe','inherit']});
 const lines=createInterface({input:child.stdout}),queued=[],waiters=[];
 lines.on('line',line=>{const value=JSON.parse(line),waiter=waiters.shift();if(waiter)waiter(value);else queued.push(value);});
 const receive=()=>queued.length?Promise.resolve(queued.shift()):new Promise(resolve=>waiters.push(resolve));
 const ready=await receive();assert(ready.ready,'Native device not ready');
 const send=async cmd=>{child.stdin.write(JSON.stringify(cmd)+'\n');const r=await receive();assert(r.ok,r.error);};
 const codes={Escape:1,Ctrl:29,Shift:42,Alt:56,AltRight:100,Meta:125,f:33,g:34,s:31,r:19,p:25,End:107,ArrowDown:108,Enter:28,Space:57,Tab:15,'[':26,']':27};
 return {ready,send,
  press:async(combo,{repeat=0}={})=>{const keys=combo.split('+').map(k=>{assert(codes[k]!==undefined,'No key '+k);return codes[k];});for(const code of keys){await send({op:'key',code,down:1});await tick(12);}for(let i=0;i<repeat;i++){await send({op:'key',code:keys.at(-1),down:2});await tick(15);}for(const code of [...keys].reverse()){await send({op:'key',code,down:0});await tick(12);}await tick(70);},
  layout:index=>execFileSync('hyprctl',['switchxkblayout',ready.device,String(index)],{encoding:'utf8'}),
  close:async()=>{child.stdin.end(JSON.stringify({op:'close'})+'\n');await new Promise(resolve=>child.on('exit',resolve));assert(child.exitCode===0,'Native device teardown');}
 };
}
