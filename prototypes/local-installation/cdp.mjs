// PROTOTYPE: local Electron DOM inspection and normal UI-control activation.
import fs from 'node:fs';
const target = (await (await fetch('http://127.0.0.1:9235/json/list', {signal:AbortSignal.timeout(5000)})).json())[0];
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open', resolve, {once:true}));
let sequence = 0;
const pending = new Map();
const contexts = [];
socket.addEventListener('message', ({data}) => {
  const message = JSON.parse(data);
  if (message.method === 'Runtime.executionContextCreated') contexts.push(message.params.context);
  if (message.id) {
    const callback = pending.get(message.id);
    pending.delete(message.id);
    message.error ? callback.reject(message.error) : callback.resolve(message.result);
  }
});
const send = (method, params = {}) => new Promise((resolve,reject) => {
  const id = ++sequence;
  pending.set(id, {resolve,reject});
  socket.send(JSON.stringify({id, method, params}));
});
try {
  await send('Runtime.enable');
  if (process.argv[2] === 'contexts') console.log(JSON.stringify({contexts, frames:await send('Page.getFrameTree')}, null, 2));
  else if (process.argv[2] === 'screenshot') {
    const {data} = await send('Page.captureScreenshot', {format:'png'});
    fs.writeFileSync(process.argv[3], Buffer.from(data, 'base64'));
  } else {
    const selector = process.argv[2];
    const context = selector === 'root' ? contexts.find(c=>c.auxData?.isDefault && c.origin === new URL(target.url).origin) : contexts.find(c=>c.auxData?.isDefault && c.origin.includes(selector));
    if (!context) throw Error(`No context matching ${selector}: ${JSON.stringify(contexts)}`);
    for (let i = 0; i < 50; i++) {
      const ready = await send('Runtime.evaluate', {expression:'!!global.LensExtensions', contextId:context.id, returnByValue:true});
      if (ready.result.value) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const expression = fs.readFileSync(process.argv[3], 'utf8');
    const result = await send('Runtime.evaluate', {expression, contextId:context.id, awaitPromise:true, returnByValue:true});
    console.log(JSON.stringify(result, null, 2));
    if (result.exceptionDetails) process.exitCode = 1;
  }
} finally { socket.close(); }
