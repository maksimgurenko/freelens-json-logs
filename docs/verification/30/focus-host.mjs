import {requireAttended} from '../../../scripts/ui-test-policy.mjs';
requireAttended();
// Opt-in native-check focus only; the calling desktop helper must restore focus.
const targets=await(await fetch('http://127.0.0.1:9235/json/list')).json();
const target=targets.find(t=>t.type==='page'&&new URL(t.url).hostname==='renderer.freelens.app');
if(!target)throw Error('No Freelens page');
const socket=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
try {await new Promise((resolve,reject)=>{socket.addEventListener('message',({data})=>{const msg=JSON.parse(data);if(msg.id===1)msg.error?reject(Error(JSON.stringify(msg.error))):resolve(msg.result);});socket.send(JSON.stringify({id:1,method:'Page.bringToFront'}));});} finally {socket.close();}
