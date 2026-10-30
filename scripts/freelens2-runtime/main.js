import { Main, Common } from '@freelensapp/extensions';
import * as Mobx from 'mobx';
import { app, BrowserWindow, ipcMain } from 'electron';
import { Worker } from 'node:worker_threads';
import { appendFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FindService } from '../../src/main/find-service.ts';
import { watchWindowVisibility } from '../../src/adapter/window-visibility.ts';
import { inspectConfiguration, resetConfiguration } from '../../src/adapter/configuration-file.ts';
import { store } from './store.js';

class Rpc extends Main.Ipc {}
const telemetry = globalThis.__probe57Telemetry ??= { starts: 0, exits: 0, live: new Set(), events: [] };
function log(event, detail = {}) {
  const value = { at: Date.now(), event, ...detail };
  telemetry.events.push(value);
  appendFileSync(join(process.env.FREELENS_INTEGRATION_TESTING_DIR, 'probe57-events.jsonl'), JSON.stringify(value) + '\n');
}
process.once('exit', () => log('process-exit', { live: telemetry.live.size, starts: telemetry.starts, exits: telemetry.exits }));

export default class ProbeMain extends Main.LensExtension {
  quit() { app.quit(); }
  stops = [];
  problem = undefined;
  settingsPath = '';
  find = undefined;
  closing = undefined;
  onActivate() {
    globalThis.__probe57 = this;
    this.closing = undefined;
    this.settingsPath = join(app.getPath('userData'), 'extension-store', this.storeName, 'readable-logs.json');
    this.problem = inspectConfiguration(this.settingsPath).problem;
    if (!this.problem) store.loadExtension(this);
    const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'worker-0.0.58.cjs'), 'utf8');
    this.find = new FindService(() => {
      const worker = new Worker(source, { eval: true });
      telemetry.starts++; telemetry.live.add(worker); log('worker-start', { threadId: worker.threadId });
      worker.once('exit', code => { telemetry.live.delete(worker); telemetry.exits++; log('worker-exit', { code, live: telemetry.live.size }); });
      return worker;
    }, '0.0.58');
    const rpc = Rpc.createInstance(this);
    this.rpc = rpc;
    const identity = event => ({ senderId: event.sender.id, senderPid: event.sender.getOSProcessId(),
      frame: event.senderFrame && { processId: event.senderFrame.processId, routingId: event.senderFrame.routingId, url: event.senderFrame.url },
      windowId: BrowserWindow.fromWebContents(event.sender)?.id });
    rpc.handle('identity', event => identity(event));
    rpc.handle('state', () => this.state());
    rpc.handle('open', (event, viewer) => this.find.open(event, viewer));
    rpc.handle('submit', (event, token, request) => this.find.submit(event, token, request));
    rpc.handle('control', (event, token, action, active) => {
      if (action === 'close') return this.find.close(event, token);
      if (action === 'cancel') return this.find.cancel(event, token);
      if (action === 'active') return this.find.setActive(event, token, active);
      throw Error('Invalid control');
    });
    rpc.handle('reset', (_event, confirmed) => {
      if (!this.problem) throw Error('No recovery needed');
      const result = resetConfiguration(this.settingsPath, confirmed);
      if (!result.error) { this.problem = undefined; store.loadExtension(this); }
      return result;
    });
    rpc.handle('visibility', (event, clusterId) => {
      const owner = BrowserWindow.fromWebContents(event.sender);
      let result;
      const stop = watchWindowVisibility(owner, clusterId, selected => { result = selected; });
      stop();
      return { identity: identity(event), selected: result, focused: owner.isFocused(), visible: owner.isVisible() };
    });
    this.stops.push(rpc.listen('ping', () => log('ping')));
    this.stops.push(Mobx.reaction(() => store.value.get(), () => log('main-reaction', { layout: store.toJSON().viewer.inspection })));
    let quitting = false;
    const beforeQuit = event => {
      if (quitting) return;
      event.preventDefault(); quitting = true;
      void this.onDeactivate().then(() => { log('quit-after-cleanup', this.state()); app.quit(); });
    };
    app.on('before-quit', beforeQuit);
    this.stops.push(() => app.removeListener('before-quit', beforeQuit));
    log('activate', { version: Common.App.version, versions: process.versions, settingsProblem: this.problem,
      mobxIdentity: Mobx.reaction === globalThis.FreelensExtensionApi.Mobx.reaction });
  }
  state() {
    const f = this.find;
    return { problem: this.problem, settingsPath: this.settingsPath, configuration: store.toJSON(),
      workers: { starts: telemetry.starts, exits: telemetry.exits, live: telemetry.live.size },
      service: f && { owners: f.owners.size, retiring: f.retiring.size, senders: f.senders.size, opening: f.opening.size, watch: !!f.stopWatch },
      handlers: [...ipcMain._invokeHandlers.keys()].filter(key => key.startsWith('extensions@')),
      extensionListeners: ipcMain.eventNames().filter(key => typeof key === 'string' && key.startsWith('extensions@')).map(key => [key, ipcMain.listenerCount(key)]),
      stops: this.stops.length };
  }
  async onDeactivate() {
    if (this.closing) return this.closing;
    this.closing = (async () => {
      log('deactivate-start', this.state());
      await this.find?.dispose();
      for (const stop of this.stops.splice(0)) stop();
      log('deactivate-end', this.state());
    })();
    return this.closing;
  }
}
