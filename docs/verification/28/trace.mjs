// Read-only packaged-renderer observer. No event cancellation, input injection,
// history writes, production hooks or native overrides. A trace without physical
// correlation does not establish #28. Main-process observation remains separate.
import {readFileSync, writeFileSync} from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';
const seconds = Number(process.argv[2] ?? 5), output = process.argv[3];
if (!(seconds > 0 && seconds <= 60) || !output) throw Error('Usage: trace.mjs <seconds:1..60> <output.json>');
const targets = await (await fetch('http://127.0.0.1:9235/json/list', {signal: AbortSignal.timeout(3000)})).json();
const target = targets.find(item => item.type === 'page');
if (!target) throw Error('No packaged host page');
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, {once: true});
  socket.addEventListener('error', reject, {once: true});
});
let id = 0;
const pending = new Map(), contexts = [], installed = [], records = [];
socket.addEventListener('message', ({data}) => {
  const message = JSON.parse(data);
  if (message.method === 'Runtime.executionContextCreated') contexts.push(message.params.context);
  if (message.method === 'Runtime.bindingCalled' && message.params.name === '__cv28TraceEvent') {
    records.push({contextId: message.params.executionContextId, ...JSON.parse(message.params.payload)});
  }
  if (message.id) {
    const promise = pending.get(message.id);
    if (!promise) return;
    pending.delete(message.id); clearTimeout(promise.timer);
    message.error ? promise.reject(Error(JSON.stringify(message.error))) : promise.resolve(message.result);
  }
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const messageId = ++id;
  const timer = setTimeout(() => { pending.delete(messageId); reject(Error('CDP timeout: ' + method)); }, 3000);
  pending.set(messageId, {resolve, reject, timer});
  socket.send(JSON.stringify({id: messageId, method, params}));
});
const run = async (expression, context) => {
  const reply = await send('Runtime.evaluate', {expression, contextId: context.id, returnByValue: true, awaitPromise: true});
  if (reply.exceptionDetails) throw Error(JSON.stringify(reply.exceptionDetails));
  return reply.result.value;
};
const result = {at: new Date().toISOString(), durationSeconds: seconds, rootUrl: target.url,
  physicalInputSource: 'not supplied; correlate physical-input.py and operator action',
  nativeCommands: 'pending owning-window main inspector observation', records};
let failure;
let nativeSocket, nativeSend;
let stop;
const stopped = new Promise(resolve => { stop = resolve; });
const stopOnInput = () => stop();
process.stdin.once('data', stopOnInput);
try {
  await send('Runtime.enable');
  const nativeTargets = await (await fetch('http://127.0.0.1:9229/json/list', {signal: AbortSignal.timeout(3000)})).json();
  if (!nativeTargets[0]) throw Error('Owning main inspector required');
  nativeSocket = new WebSocket(nativeTargets[0].webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { nativeSocket.addEventListener('open', resolve, {once: true}); nativeSocket.addEventListener('error', reject, {once: true}); });
  const nativePending = new Map(); let nativeId = 0;
  nativeSocket.addEventListener('message', ({data}) => {
    const message = JSON.parse(data);
    if (message.method === 'Runtime.bindingCalled' && message.params.name === '__cv28NativeTraceEvent') records.push({source: 'owning main process', ...JSON.parse(message.params.payload)});
    const promise = nativePending.get(message.id);
    if (promise) { nativePending.delete(message.id); clearTimeout(promise.timer); message.error ? promise.reject(Error(JSON.stringify(message.error))) : promise.resolve(message.result); }
  });
  nativeSend = (method, params = {}) => new Promise((resolve, reject) => {
    const number = ++nativeId, timer = setTimeout(() => { nativePending.delete(number); reject(Error('Native inspector timeout: ' + method)); }, 3000);
    nativePending.set(number, {resolve, reject, timer}); nativeSocket.send(JSON.stringify({id: number, method, params}));
  });
  await nativeSend('Runtime.enable');
  await nativeSend('Runtime.addBinding', {name: '__cv28NativeTraceEvent'});
  const nativeProbe = readFileSync(new URL('./probes/observe-main.js', import.meta.url), 'utf8').replace('__ROOT_URL_JSON__', JSON.stringify(target.url));
  const nativeReply = await nativeSend('Runtime.evaluate', {expression: nativeProbe, returnByValue: true});
  if (nativeReply.exceptionDetails) throw Error(JSON.stringify(nativeReply.exceptionDetails));
  result.nativeBefore = nativeReply.result.value;
  result.nativeCommands = 'passive app-command, before-mouse-event and navigation listeners on the exact owning BrowserWindow/WebContents';
  const mainContext = contexts.find(context => context.auxData?.isDefault && context.origin === new URL(target.url).origin);
  const frameTree = await send('Page.getFrameTree');
  const cluster = new URL(target.url).pathname.match(/^\/cluster\/([^/]+)$/)?.[1];
  const clusterContext = contexts.find(context => context.auxData?.isDefault && new URL(context.origin).hostname.startsWith(cluster + '.'));
  if (!mainContext || !clusterContext || !cluster) throw Error('Owning main and cluster contexts required');
  result.frames = frameTree; result.contexts = [mainContext, clusterContext];
  result.before = [];
  for (const context of result.contexts) {
    await send('Runtime.addBinding', {name: '__cv28TraceEvent', executionContextId: context.id});
    // Track partial setup too: finally removes the binding if installation fails.
    installed.push(context);
    const state = await run(readFileSync(new URL('./probes/observe.js', import.meta.url), 'utf8'), context);
    result.before.push({contextId: context.id, ...state});
  }
  console.log(JSON.stringify({ready: true, output, contexts: result.contexts.map(context => context.id)}));
  await Promise.race([delay(seconds * 1000, undefined, {ref: false}), stopped]);
} catch (error) {
  failure = error; result.failure = error.stack;
} finally {
  result.after = [];
  for (const context of installed.reverse()) {
    try {
      result.after.push({contextId: context.id, ...await run(`(() => {
        globalThis.__cv28Observation?.stop();
        delete globalThis.__cv28Observation;
        delete globalThis.__cv28TraceEvent;
        return {url: location.href, historyLength: history.length, observerRemoved: !globalThis.__cv28Observation, bindingRemoved: !globalThis.__cv28TraceEvent};
      })()`, context)});
    } catch (error) { result.cleanupFailure ??= []; result.cleanupFailure.push({contextId: context.id, error: error.message}); }
  }
  try { await send('Runtime.removeBinding', {name: '__cv28TraceEvent'}); }
  catch (error) { result.cleanupFailure ??= []; result.cleanupFailure.push({error: error.message}); }
  if (nativeSend) {
    try {
      const reply = await nativeSend('Runtime.evaluate', {expression: `(() => { globalThis.__cv28MainObservation?.stop(); delete globalThis.__cv28MainObservation; delete globalThis.__cv28NativeTraceEvent; return {observerRemoved: !globalThis.__cv28MainObservation, bindingRemoved: !globalThis.__cv28NativeTraceEvent}; })()`, returnByValue: true});
      if (reply.exceptionDetails) throw Error(JSON.stringify(reply.exceptionDetails));
      result.nativeAfter = reply.result.value;
      await nativeSend('Runtime.removeBinding', {name: '__cv28NativeTraceEvent'});
    } catch (error) { result.cleanupFailure ??= []; result.cleanupFailure.push({source: 'native', error: error.message}); }
  }
  nativeSocket?.close();
  socket.close();
  process.stdin.removeListener('data', stopOnInput);
  process.stdin.pause();
  result.acceptance = 'unverified: no cancellation or native-path acceptance claimed';
  writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
}
if (failure || result.cleanupFailure) throw failure ?? Error('Trace cleanup failed; inspect ' + output);
console.log(JSON.stringify({records: records.length, output, observerRemoved: true}));
