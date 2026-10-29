// Test-only SDK/Electron stand-ins. Executes the real production main bundle
// and package-relative trusted worker, without any installed host or settings.
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createRequire } from 'node:module';
import Module from 'node:module';
import { Worker } from 'node:worker_threads';
import * as Mobx from 'mobx';

/** Electron invokes the SDK synchronously in caller order. Parallel HTTP body
 * uploads can finish out of order; dispatch their numbered calls in send order
 * while leaving replies concurrent so cancellation can interrupt matching.
 */
export class OrderedFindTransport {
  next = 1;
  waiting = new Map();
  closed = false;
  get pending() { return this.waiting.size; }
  dispatch(sequence, invoke) {
    if (this.closed) return Promise.reject(new Error('Find transport disposed'));
    if (!Number.isSafeInteger(sequence) || sequence < this.next || sequence > this.next + 128 || this.waiting.has(sequence)) {
      return Promise.reject(new Error('Invalid Find transport sequence'));
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.waiting.delete(sequence); reject(new Error('Missing Find transport sequence')); }, 5000);
      this.waiting.set(sequence, { invoke, resolve, reject, timer });
      while (this.waiting.has(this.next)) {
        const call = this.waiting.get(this.next); this.waiting.delete(this.next++); clearTimeout(call.timer);
        try { call.resolve(call.invoke()); } catch (error) { call.reject(error); }
      }
    });
  }
  dispose() {
    this.closed = true;
    for (const call of this.waiting.values()) { clearTimeout(call.timer); call.reject(new Error('Find transport disposed')); }
    this.waiting.clear();
  }
}

export function packedFindBridge(entry, settingsDirectory) {
  const handlers = new Map(), live = new Set(), owners = new Map();
  const transport = new OrderedFindTransport();
  let starts = 0, exits = 0, peak = 0, inflight = 0, peakInflight = 0, workerListenersAfterExit = 0, maxStopToExitMs = 0;
  const app = Object.assign(new EventEmitter(), { quit() {} });
  const frames = [{ processId: 1, routingId: 1 }, { processId: 1, routingId: 2 }];
  const sender = Object.assign(new EventEmitter(), { isDestroyed: () => false, mainFrame: { framesInSubtree: [...frames] } });
  class Ipc { static createInstance() { return {
    handle(channel, handler) { handlers.set(channel, handler); }, listen: () => () => {}, broadcast() {},
  }; } }
  class ExtensionStore {
    static getInstanceOrCreate() { return new this(); }
    cwd() { return settingsDirectory; }
    loadExtension() {}
  }
  class ObservedWorker extends Worker {
    stoppedAt;
    constructor(...args) {
      super(...args); starts++; live.add(this); peak = Math.max(peak, live.size);
      this.once('exit', () => {
        exits++; live.delete(this);
        if (this.stoppedAt !== undefined) maxStopToExitMs = Math.max(maxStopToExitMs, performance.now() - this.stoppedAt);
        // The production exit handler runs later in this same dispatch.
        queueMicrotask(() => { workerListenersAfterExit = Math.max(workerListenersAfterExit, this.eventNames().length); });
      });
    }
    terminate() { this.stoppedAt ??= performance.now(); return super.terminate(); }
  }
  const originalLoad = Module._load, originalHost = global.LensExtensions, originalMobx = global.Mobx;
  let extension;
  try {
    global.LensExtensions = { Main: { Ipc, LensExtension: class {} }, Common: { Store: { ExtensionStore } } };
    global.Mobx = Mobx;
    Module._load = function(name, ...args) {
      if (name === 'electron') return { app, BrowserWindow: {} };
      if (name === 'node:worker_threads') return { Worker: ObservedWorker };
      return originalLoad.call(this, name, ...args);
    };
    const require = createRequire(import.meta.url);
    delete require.cache[require.resolve(entry)];
    extension = new (require(entry).default)(); extension.onActivate();
  } finally { Module._load = originalLoad; global.LensExtensions = originalHost; global.Mobx = originalMobx; }
  return {
    removeFrame: index => { sender.mainFrame.framesInSubtree = sender.mainFrame.framesInSubtree.filter(frame => frame !== frames[index]); },
    status: () => ({ starts, exits, live: live.size, peak, owners: owners.size, inflight, peakInflight,
      workerListenersAfterExit, maxStopToExitMs, queuedTransport: transport.pending,
      senderListeners: sender.eventNames().length, appListeners: app.eventNames().length }),
    invoke: (channel, args, frame = 1) => {
      assert(handlers.has(channel), `Unknown SDK RPC ${channel}`);
      const result = handlers.get(channel)({ sender, senderFrame: frames[frame] }, ...args);
      inflight++; peakInflight = Math.max(peakInflight, inflight);
      return Promise.resolve(result).then(value => {
        if (channel === 'find-open') {
          for (const [token, owner] of owners) if (owner.frame === frame && owner.viewer === args[0]) owners.delete(token);
          owners.set(value, { frame, viewer: args[0] });
        }
        if (channel === 'find-control' && args[1] === 'close') owners.delete(args[0]);
        return value;
      }).finally(() => { inflight--; });
    },
    async dispose() {
      transport.dispose();
      await extension.onDeactivate(); assert.equal(live.size, 0); assert.equal(sender.eventNames().length, 0); assert.equal(app.eventNames().length, 0);
      handlers.clear(); owners.clear(); // Actual SDK handler lifecycle still needs actual-host proof.
    },
    async http(request, response) {
      try {
        let body = ''; for await (const chunk of request) { body += chunk; assert(body.length <= 24 * 1024 * 1024); }
        const { sequence, channel, args } = JSON.parse(body);
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({ value: await transport.dispatch(sequence, () => this.invoke(channel, args)) }));
      } catch (error) { response.statusCode = 400; response.end(JSON.stringify({ error: String(error) })); }
    },
  };
}
