// Opt-in verification transport for public Electron APIs in the owning process.
import {readFileSync} from 'node:fs';
const targets=await(await fetch('http://127.0.0.1:9229/json/list',{signal:AbortSignal.timeout(3000)})).json();
if(!targets[0])throw Error('Main inspector unavailable');
const socket=new WebSocket(targets[0].webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
const expression=readFileSync(process.argv[2],'utf8').replaceAll('__ARG_JSON__',JSON.stringify(process.argv[3]??null));
const timer=setTimeout(()=>{socket.close();throw Error('Main probe timed out');},5000);
try{
 socket.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression,returnByValue:true,awaitPromise:true}}));
 const result=await new Promise(resolve=>socket.addEventListener('message',({data})=>{const r=JSON.parse(data);if(r.id===1)resolve(r.result);}));
 console.log(JSON.stringify(result,null,2));if(result.exceptionDetails)process.exitCode=1;
}finally{clearTimeout(timer);socket.close();}
