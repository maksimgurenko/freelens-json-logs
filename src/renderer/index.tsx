import { requirePodApi } from '../adapter/renderer-compatibility.ts';
import React from 'react';
import { Renderer } from '@freelensapp/extensions';
import './viewer.css';
import { freelensPort, PAGE_ID, pageTarget, viewerVisibility } from '../adapter/freelens.ts';
import { Viewer } from './viewer.tsx';
import { getConfigurationStore, type ConfigurationStore } from '../adapter/configuration-store.ts';
import { requireHostFunctions } from '../adapter/host-compatibility.ts';
import { SETTINGS_CHANGED, SETTINGS_RESET, SETTINGS_SAVE_PROFILE, SETTINGS_STATUS,
  type ResetReply, type SettingsStatus } from '../adapter/configuration-ipc.ts';
import { findTransport } from '../adapter/find-ipc.ts';
import { writeClipboard } from '../adapter/clipboard.ts';
import { LogRequests } from '../core/requests.ts';
import { ShortcutCapture } from './local-shortcuts.ts';

declare const READABLE_LOGS_VERSION: string;
// An invalidated read still owns its target across viewer unmounts and disable.
const requests = new LogRequests();
const ViewerIcon = ({ material }: { material: string }) => <Renderer.Component.Icon material={material} />;

class ConfigurationIpc extends Renderer.Ipc {}

async function requestSettingsStatus(ipc: Renderer.Ipc, active: () => boolean): Promise<SettingsStatus | undefined> {
  // The host can broadcast enablement before the main entry registers its RPC.
  for (let delay = 25; active(); delay *= 2) {
    try {
      return await ipc.invoke(SETTINGS_STATUS);
    } catch (error) {
      if (delay > 800 || !(error instanceof Error) ||
        !error.message.includes('No handler registered for') || !error.message.includes(SETTINGS_STATUS)) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export default class ReadableLogsRenderer extends Renderer.LensExtension {
  private settings?: ConfigurationStore;
  private viewers = new Set<() => void | Promise<void>>();
  private stopRecovery?: () => void;
  private shortcuts = new ShortcutCapture();
  private stopShortcuts?: () => void;
  private register = (dispose: () => void | Promise<void>) => {
    this.viewers.add(dispose);
    return () => { this.viewers.delete(dispose); };
  };
  async onActivate() {
    // Freelens provides the Pod API only in cluster iframes.
    if (window === window.top) return;
    requirePodApi();
    const ipc = ConfigurationIpc.createInstance(this);
    requireHostFunctions({
      'Renderer.Ipc.listen': ipc?.listen,
      'Renderer.Ipc.invoke': ipc?.invoke,
    });
    this.stopShortcuts = this.shortcuts.bind(window);
    let latestStatus: SettingsStatus | undefined;
    const applyStatus = (status: SettingsStatus) => {
      latestStatus = status;
      const settings = this.settings;
      if (settings && (!status.backup || settings.lastBackup !== status.backup)) settings.attach(this, status);
    };
    const stopRecovery = ipc.listen(SETTINGS_CHANGED, (_event, status: SettingsStatus) => applyStatus(status));
    this.stopRecovery = stopRecovery;
    const active = () => this.stopRecovery === stopRecovery;
    let initialStatus: SettingsStatus | undefined;
    try {
      initialStatus = await requestSettingsStatus(ipc, active);
      if (active() && !initialStatus) throw new Error('Main returned no settings status.');
    } catch (error) {
      if (!active()) return;
      await this.onDeactivate();
      throw new Error(`Readable logs cannot reach the main settings interface (${SETTINGS_STATUS}).`, { cause: error });
    }
    if (!active() || !initialStatus) return;
    const settings = this.settings = getConfigurationStore();
    settings.bindProfileSave(profile => ipc.invoke(SETTINGS_SAVE_PROFILE, profile));
    settings.bindReset(async confirmed => {
      const result: ResetReply = await ipc.invoke(SETTINGS_RESET, confirmed);
      if (active() && result.status) applyStatus(result.status);
      return result;
    });
    settings.attach(this, latestStatus ?? initialStatus);
    this.registerViewer(ipc, settings);
  }
  private registerViewer(ipc: Renderer.Ipc, settings: ConfigurationStore) {
    const bindVisibility = viewerVisibility(ipc);
    const find = findTransport(ipc);
    this.clusterPages = [{
      id: PAGE_ID, params: { namespace: '', pod: '', podUid: '', clusterId: '' },
      components: { Page: ({ params }) => {
        const target = pageTarget(params);
        return <Viewer key={JSON.stringify([target.clusterId, target.namespace, target.podName, target.podUid])}
          target={target} logs={freelensPort} requests={requests} preferences={settings} find={find}
          writeClipboard={writeClipboard} bindVisibility={bindVisibility} register={this.register}
          shortcutCapture={this.shortcuts} Icon={ViewerIcon} version={READABLE_LOGS_VERSION} />;
      } },
    }];
    this.kubeObjectMenuItems = [{
      kind: 'Pod', apiVersions: ['v1'], components: {
        MenuItem: ({ object, toolbar }: { object: Renderer.K8sApi.Pod; toolbar?: boolean }) => {
          if (!object) return null;
          return <Renderer.Component.MenuItem onClick={() => {
            const cluster = Renderer.Catalog.getActiveCluster();
            if (!cluster) return;
            const { namespace, name, uid } = object.metadata;
            this.navigate(PAGE_ID, { clusterId: cluster.id, namespace: namespace || undefined, pod: name, podUid: uid });
          }}>
            <Renderer.Component.Icon material="data_object" interactive={toolbar} tooltip="Readable logs" />
            <span className="title">Readable logs</span>
          </Renderer.Component.MenuItem>;
        },
      },
    }];
  }
  async onDeactivate() {
    this.stopShortcuts?.();
    this.stopRecovery?.();
    this.stopRecovery = undefined;
    this.stopShortcuts = undefined;
    this.settings?.bindProfileSave();
    this.settings?.bindReset();
    this.settings?.detach();
    this.settings = undefined;
    this.clusterPages = [];
    this.kubeObjectMenuItems = [];
    const closing = [...this.viewers].map(dispose => dispose());
    this.viewers.clear();
    await Promise.all(closing);
  }
}
