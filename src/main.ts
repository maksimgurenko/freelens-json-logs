import { Main } from '@freelensapp/extensions';
import { BrowserWindow } from 'electron';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { isDeepStrictEqual } from 'node:util';
import { FindService } from './main/find-service.ts';
import { FIND_CONTROL, FIND_OPEN, FIND_REQUEST } from './adapter/find-ipc.ts';

import { VISIBILITY_REQUEST, VISIBILITY_STOP } from './adapter/visibility.ts';
import { watchWindowVisibility } from './adapter/window-visibility.ts';
import { configurationStore } from './adapter/configuration-store.ts';
import { inspectConfiguration, resetConfiguration } from './adapter/configuration-file.ts';
import { SETTINGS_CHANGED, SETTINGS_RESET, SETTINGS_SAVE_PROFILE, SETTINGS_STATUS, type ResetReply } from './adapter/configuration-ipc.ts';
import { CONFIG_NAME } from './core/configuration.ts';
import type { Profile } from './core/profiles.ts';

declare const READABLE_LOGS_VERSION: string;

class VisibilityIpc extends Main.Ipc {}

type VisibilitySubscription = { sender: Electron.WebContents; processId: number; routingId: number; stop: () => void };

// Main owns durable settings and observes native windows, including CSS-hidden frames.
export default class ReadableLogsMain extends Main.LensExtension {
  private subscriptions = new Map<string, VisibilitySubscription>();
  private find?: FindService;
  private stopping?: Promise<void>;
  private loadSettings() {
    const path = join(configurationStore.resolveSettingsDirectory(this), `${CONFIG_NAME}.json`);
    configurationStore.attach(this, { path, problem: inspectConfiguration(path).problem });
  }
  onActivate() {
    this.stopping = undefined;
    try { this.loadSettings(); }
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
    const settingsStatus = () => ({ path: configurationStore.settingsPath, problem: configurationStore.problem });
    ipc.handle(SETTINGS_STATUS, settingsStatus);
    ipc.handle(SETTINGS_SAVE_PROFILE, (_event, profile: Profile) => {
      const path = configurationStore.settingsPath;
      const current = inspectConfiguration(path);
      if (current.problem) {
        configurationStore.attach(this, { path, problem: current.problem });
        ipc.broadcast(SETTINGS_CHANGED, settingsStatus());
        throw new Error(current.problem);
      }
      configurationStore.saveProfile(profile);
      // The SDK writes synchronously in main, but its MobX reaction does not
      // propagate a disk error to the action that changed the model.
      const persisted = inspectConfiguration(path);
      if (!persisted.problem && isDeepStrictEqual(persisted.data, JSON.parse(JSON.stringify(configurationStore.toJSON())))) return;
      configurationStore.attach(this, { path, problem: persisted.problem });
      if (configurationStore.problem) ipc.broadcast(SETTINGS_CHANGED, settingsStatus());
      throw new Error(persisted.problem ?? 'Unable to write the formatting profile to saved settings.');
    });
    ipc.handle(SETTINGS_RESET, (_event, confirmed: boolean): ResetReply => {
      if (!configurationStore.problem) return { error: 'Settings are usable; no recovery reset is needed.' };
      const result = resetConfiguration(configurationStore.settingsPath, confirmed, () => {
        this.loadSettings();
        if (configurationStore.problem) throw new Error(configurationStore.problem);
      });
      if (!result.error && result.backup) {
        const status = { ...settingsStatus(), backup: result.backup };
        ipc.broadcast(SETTINGS_CHANGED, status);
        return { ...result, status };
      }
      return result;
    });
    // RPC supplies the frame and its WebContents independently of focus.
    ipc.handle(VISIBILITY_REQUEST, (event, clusterId: string, reply: string) => {
      if (typeof clusterId !== 'string' || typeof reply !== 'string' || !reply.startsWith('viewer-visibility-')) return;
      const frame = event.senderFrame;
      if (!frame || frame.isDestroyed() || frame.detached || this.subscriptions.has(reply)) return;
      const sender = event.sender;
      const window = BrowserWindow.fromWebContents(sender);
      if (!window) { ipc.broadcast(reply, null); return; }
      const { processId, routingId } = frame;
      const ownsDocument = () => {
        try { return !frame.isDestroyed() && !frame.detached && frame.processId === processId && frame.routingId === routingId; }
        catch { return false; }
      };
      const unwatch = watchWindowVisibility(window, clusterId, selected => ipc.broadcast(reply, selected));
      const stop = () => {
        clearInterval(checkFrame);
        unwatch();
        window.removeListener('closed', stop);
        sender.removeListener('render-process-gone', stop);
        sender.removeListener('did-frame-navigate', navigated);
        this.subscriptions.delete(reply);
      };
      const navigated = (_event: Electron.Event, _url: string, _code: number, _status: string, main: boolean, pid: number, id: number) => {
        if (main || (pid === processId && id === routingId) || !ownsDocument()) stop();
      };
      // Removing a cached cluster iframe may send neither a stop RPC nor a navigation event.
      const checkFrame = setInterval(() => { if (!ownsDocument()) stop(); }, 1000).unref();
      window.once('closed', stop);
      sender.on('render-process-gone', stop);
      sender.on('did-frame-navigate', navigated);
      this.subscriptions.set(reply, { sender, processId, routingId, stop });
    });
    ipc.handle(VISIBILITY_STOP, (event, reply: string) => {
      const subscription = this.subscriptions.get(reply);
      const frame = event.senderFrame;
      if (subscription?.sender === event.sender && frame &&
        subscription.processId === frame.processId && subscription.routingId === frame.routingId) subscription.stop();
    });
  }
  async onDeactivate() {
    if (this.stopping) return this.stopping;
    configurationStore.detach();
    for (const { stop } of this.subscriptions.values()) stop();
    const find = this.find; this.find = undefined;
    // Freelens 2 awaits deactivation before removing SDK handlers on disable and quit.
    this.stopping = find?.dispose() ?? Promise.resolve();
    await this.stopping;
  }
}
