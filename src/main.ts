import { Main } from '@freelensapp/extensions';
import { BrowserWindow } from 'electron';
import { VISIBILITY_REQUEST, VISIBILITY_STOP } from './adapter/visibility.ts';
import { watchWindowVisibility } from './adapter/window-visibility.ts';
import { configurationStore } from './adapter/configuration-store.ts';
import { resetConfiguration } from './adapter/configuration-file.ts';
import { SETTINGS_RESET, SETTINGS_RESET_COMPLETE } from './adapter/configuration-ipc.ts';

class VisibilityIpc extends Main.Ipc {}

// Main owns durable settings and observes native windows, including CSS-hidden frames.
export default class ReadableLogsMain extends Main.LensExtension {
  private subscriptions = new Map<string, () => void>();
  private listeners: (() => void)[] = [];
  onActivate() {
    try { configurationStore.loadExtension(this); }
    catch (error) { configurationStore.failed(error); }
    const ipc = VisibilityIpc.createInstance(this);
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
  onDeactivate() {
    for (const stop of this.subscriptions.values()) stop();
    for (const stop of this.listeners) stop();
    this.subscriptions.clear(); this.listeners = [];
  }
}
