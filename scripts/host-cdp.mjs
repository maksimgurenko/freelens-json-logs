// Local verification helper; never bundled into the extension. Targets the host's
// opt-in localhost debugging endpoint, evaluates supplied probes, and captures PNGs.
import { readFileSync, writeFileSync } from 'node:fs';
const targets = await (await fetch('http://127.0.0.1:9235/json/list', { signal: AbortSignal.timeout(5000) })).json();
const target = targets.find(value => value.type === 'page');
if (!target) throw new Error('No Freelens page on localhost:9235');
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let nextId = 0;
const pending = new Map();
const contexts = [];
const timer = setTimeout(() => { console.error('Host probe exceeded 20 seconds'); socket.close(); process.exit(1); }, 20_000);
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.method === 'Runtime.executionContextCreated') contexts.push(message.params.context);
  if (message.id) {
    const callback = pending.get(message.id);
    pending.delete(message.id);
    if (callback) message.error ? callback.reject(message.error) : callback.resolve(message.result);
  }
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId; pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
try {
  await send('Runtime.enable');
  if (process.argv[2] === 'contexts') console.log(JSON.stringify({ at: new Date().toISOString(), contexts, frames: await send('Page.getFrameTree') }, null, 2));
  else if (process.argv[2] === 'screenshot') {
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(process.argv[3], Buffer.from(data, 'base64'));
  } else {
    const selector = process.argv[2];
    const context = selector === 'root'
      ? contexts.find(value => value.auxData?.isDefault && value.origin === new URL(target.url).origin)
      : contexts.find(value => value.auxData?.isDefault && value.origin.includes(selector));
    if (!context) throw new Error(`Missing context ${selector}`);
    for (let attempt = 0; attempt < 100; attempt++) {
      const ready = await send('Runtime.evaluate', { expression: '!!global.LensExtensions', contextId: context.id, returnByValue: true });
      if (ready.result.value) break;
      if (attempt === 99) throw new Error('Host SDK did not become ready');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const result = await send('Runtime.evaluate', { expression: readFileSync(process.argv[3], 'utf8'), contextId: context.id, awaitPromise: true, returnByValue: true });
    console.log(JSON.stringify({ at: new Date().toISOString(), ...result }, null, 2));
    if (result.exceptionDetails) process.exitCode = 1;
  }
} finally { clearTimeout(timer); socket.close(); }
