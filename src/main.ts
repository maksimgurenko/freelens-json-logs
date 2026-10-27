import { Main } from '@freelensapp/extensions';
import { app, BrowserWindow } from 'electron';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { FindService } from './main/find-service.ts';
import { FIND_CONTROL, FIND_OPEN, FIND_REQUEST } from './adapter/find-ipc.ts';

import { VISIBILITY_REQUEST, VISIBILITY_STOP } from './adapter/visibility.ts';
import { watchWindowVisibility } from './adapter/window-visibility.ts';
import { configurationStore } from './adapter/configuration-store.ts';
import { resetConfiguration } from './adapter/configuration-file.ts';
import { SETTINGS_RESET, SETTINGS_RESET_COMPLETE } from './adapter/configuration-ipc.ts';

declare const READABLE_LOGS_VERSION: string;

class VisibilityIpc extends Main.Ipc {}

// Main owns durable settings and observes native windows, including CSS-hidden frames.
export default class ReadableLogsMain extends Main.LensExtension {
  private subscriptions = new Map<string, () => void>();
  private listeners: (() => void)[] = [];
  private find?: FindService;
  private stopping?: Promise<void>;
  onActivate() {
    this.stopping = undefined;
    try { configurationStore.loadExtension(this); }
    catch (error) { configurationStore.failed(error); }
    const ipc = VisibilityIpc.createInstance(this);
    const find = new FindService(() => new Worker(readFileSync(join(__dirname,
      `find-worker-${READABLE_LOGS_VERSION}.js`), 'utf8'), { eval: true }), READABLE_LOGS_VERSION);
    this.find = find;
    ipc.handle(FIND_OPEN, (event, viewer) => find.open(event, viewer));
    ipc.handle(FIND_REQUEST, (event, token, request) => find.submit(event, token, request));
    ipc.handle(FIND_CONTROL, (event, token, action, active) => {
      if (action === 'active') return find.setActive(event, token, active);
      if (action === 'cancel') return find.cancel(event, token);
      if (action === 'close') return find.close(event, token);
      throw new TypeError('Invalid Find control');
    });
    // Shutdown must wait for the real worker exit, including startup/idle work.
    let quitting = false;
    const beforeQuit = (event: Electron.Event) => {
      if (quitting) return;
      event.preventDefault(); quitting = true;
      void this.onDeactivate().then(() => app.quit());
    };
    app.on('before-quit', beforeQuit);
    this.listeners.push(() => app.removeListener('before-quit', beforeQuit));
    ipc.handle(SETTINGS_RESET, (_event, confirmed: boolean) => {
      if (!configurationStore.problem) return { error: 'Settings are usable; no recovery reset is needed.' };
      const result = resetConfiguration(configurationStore.settingsPath, confirmed);
      if (!result.error && result.backup) {
        configurationStore.loadExtension(this);
        configurationStore.backedUp(result.backup);
        ipc.broadcast(SETTINGS_RESET_COMPLETE, result.backup);
        if (configurationStore.problem) return { ...result, error: configurationStore.problem };
      }
      return result;
    });
    // Broadcast callbacks in 1.10.3 have no sender. RPC preserves the requesting
    // webContents, so each viewer observes its own window rather than focused state.
    ipc.handle(VISIBILITY_REQUEST, (event, clusterId: string, reply: string) => {
      if (typeof clusterId !== 'string' || typeof reply !== 'string' || !reply.startsWith('viewer-visibility-')) return;
      this.subscriptions.get(reply)?.();
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) { ipc.broadcast(reply, null); return; }
      this.subscriptions.set(reply, watchWindowVisibility(window, clusterId, selected => ipc.broadcast(reply, selected)));
    });
    this.listeners.push(ipc.listen(VISIBILITY_STOP, (_event, reply: string) => {
      this.subscriptions.get(reply)?.(); this.subscriptions.delete(reply);
    }));
  }
  async onDeactivate() {
    if (this.stopping) return this.stopping;
    for (const stop of this.subscriptions.values()) stop();
    for (const stop of this.listeners) stop();
    this.subscriptions.clear(); this.listeners = [];
    const find = this.find; this.find = undefined;
    this.stopping = find?.dispose() ?? Promise.resolve();
    await this.stopping;
  }
}
