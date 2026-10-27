// Test-only SDK/Electron stand-ins. Executes the real production main bundle
// and package-relative trusted worker, without any installed host or settings.
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createRequire } from 'node:module';
import Module from 'node:module';
import { Worker } from 'node:worker_threads';
import * as Mobx from 'mobx';

export function packedFindBridge(entry, settingsDirectory) {
  const handlers = new Map(), live = new Set();
  let starts = 0, exits = 0, peak = 0;
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
    constructor(...args) {
      super(...args); starts++; live.add(this); peak = Math.max(peak, live.size);
      this.once('exit', () => { exits++; live.delete(this); });
    }
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
    status: () => ({ starts, exits, live: live.size, peak, senderListeners: sender.eventNames().length, appListeners: app.eventNames().length }),
    invoke: (channel, args, frame = 1) => {
      assert(handlers.has(channel), `Unknown SDK RPC ${channel}`);
      return handlers.get(channel)({ sender, senderFrame: frames[frame] }, ...args);
    },
    async dispose() {
      await extension.onDeactivate(); assert.equal(live.size, 0); assert.equal(sender.eventNames().length, 0); assert.equal(app.eventNames().length, 0);
      handlers.clear(); // Actual SDK handler lifecycle still needs actual-host proof.
    },
    async http(request, response) {
      try {
        let body = ''; for await (const chunk of request) { body += chunk; assert(body.length <= 24 * 1024 * 1024); }
        const { channel, args } = JSON.parse(body);
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({ value: await this.invoke(channel, args) }));
      } catch (error) { response.statusCode = 400; response.end(JSON.stringify({ error: String(error) })); }
    },
  };
}
