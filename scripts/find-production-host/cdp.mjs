import { scratch, evidence, ticket } from './config.mjs';
// Test driver for #42's private graphical session. Never targets the user host.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { requireAttended } from '../ui-test-policy.mjs';
import WebSocket from 'ws'; // Already locked in the SDK development tree.

export async function connect(port) {
  assert([9241, 9242].includes(port));
  const session = JSON.parse(readFileSync(`${scratch}/session.json`, 'utf8'));
  const integration = readFileSync(`${scratch}/integration-path`, 'utf8');
  const hostPid = Number(readFileSync(`${scratch}/host-pid`, 'utf8'));
  assert(session.runtime.startsWith('/tmp/fd-'));
  assert.notEqual(session.instance, process.env.HYPRLAND_INSTANCE_SIGNATURE);
  assert(readFileSync(`/proc/${hostPid}/environ`, 'utf8').split('\0').includes(`WAYLAND_DISPLAY=${session.environment.WAYLAND_DISPLAY}`));
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const target = targets.find(value => port === 9242 || value.type === 'page');
  assert(target, 'Private debug target missing');
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let id = 0;
  const waiting = new Map(), contexts = new Map(), events = [], subscribers = new Set();
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.method) for (const listener of subscribers) listener(message);
    if (message.method?.startsWith('NodeWorker.')) events.push(message);
    if (message.method === 'Runtime.executionContextCreated') contexts.set(message.params.context.id, message.params.context);
    if (message.method === 'Runtime.executionContextDestroyed') contexts.delete(message.params.executionContextId);
    if (message.id) {
      const pair = waiting.get(message.id); waiting.delete(message.id);
      if (pair) message.error ? pair.reject(message.error) : pair.resolve(message.result);
    }
  });
  const send = (method, params = {}) => {
    if (method === 'Page.bringToFront') requireAttended();
    return new Promise((resolve, reject) => {
      const next = ++id; waiting.set(next, { resolve, reject });
      socket.send(JSON.stringify({ id: next, method, params }));
    });
  };
  const evaluate = async (expression, context) => {
    const result = await send('Runtime.evaluate', { expression, contextId: context?.id, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result?.value;
  };
  await send('Runtime.enable');
  const root = [...contexts.values()].find(c => c.auxData?.isDefault && /^https:\/\/renderer\./.test(c.origin));
  const identity = await evaluate(`({integration:process.env.FREELENS_INTEGRATION_TESTING_DIR,wayland:process.env.WAYLAND_DISPLAY,pid:process.pid})`, root);
  assert.equal(identity.integration, integration);
  assert.equal(identity.wayland, session.environment.WAYLAND_DISPLAY);
  if (port === 9242) assert.equal(identity.pid, hostPid);
  return { send, evaluate, contexts, events, subscribe(listener) { subscribers.add(listener); return () => subscribers.delete(listener); }, close: () => socket.terminate() };
}

if (process.argv[1]?.endsWith('/cdp.mjs')) {
  const connection = await connect(Number(process.argv[2]));
  const timer = setTimeout(() => { connection.close(); process.exit(2); }, 50_000);
  try {
    const context = [...connection.contexts.values()].find(value => value.auxData?.isDefault &&
      (process.argv[3] === 'root' ? /^https:\/\/renderer\./.test(value.origin) : value.origin.includes(process.argv[3])));
    const probe = process.argv[4] === 'contexts' ? null : readFileSync(process.argv[4], 'utf8');
    if (probe?.startsWith('// @ui-attended')) requireAttended();
    console.log(JSON.stringify(probe === null ? [...connection.contexts.values()] :
      await connection.evaluate(probe, context), null, 2));
  } finally { clearTimeout(timer); connection.close(); }
}
