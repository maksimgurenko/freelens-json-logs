import React from 'react';
import { Renderer } from '@freelensapp/extensions';
import './viewer.css';
import { freelensPort, PAGE_ID, pageTarget, viewerVisibility } from '../adapter/freelens.ts';
import { Viewer } from './viewer.tsx';
import { configurationStore } from '../adapter/configuration-store.ts';
import { SETTINGS_RESET, SETTINGS_RESET_COMPLETE, SETTINGS_STATUS, type SettingsStatus } from '../adapter/configuration-ipc.ts';
import { findTransport } from '../adapter/find-ipc.ts';
import { writeClipboard } from '../adapter/clipboard.ts';
import { LogRequests } from '../core/requests.ts';
import { ShortcutCapture } from './local-shortcuts.ts';

declare const READABLE_LOGS_VERSION: string;
// An invalidated read still owns its target across viewer unmounts and disable.
const requests = new LogRequests();
const ViewerIcon = ({ material }: { material: string }) => <Renderer.Component.Icon material={material} />;

class ConfigurationIpc extends Renderer.Ipc {}

export default class ReadableLogsRenderer extends Renderer.LensExtension {
  private bindVisibility = viewerVisibility(this);
  private findRpc = ConfigurationIpc.createInstance(this);
  private find = findTransport(this.findRpc);
  private viewers = new Set<() => void | Promise<void>>();
  private stopRecovery?: () => void;
  private shortcuts = new ShortcutCapture();
  private stopShortcuts?: () => void;
  private register = (dispose: () => void | Promise<void>) => {
    this.viewers.add(dispose);
    return () => { this.viewers.delete(dispose); };
  };
  clusterPages: Renderer.LensExtension['clusterPages'] = [{
    id: PAGE_ID, params: { namespace: '', pod: '', podUid: '', clusterId: '' },
    components: { Page: ({ params }) => {
      const target = pageTarget(params);
      return <Viewer key={JSON.stringify([target.clusterId, target.namespace, target.podName, target.podUid])}
        target={target} logs={freelensPort} requests={requests} preferences={configurationStore} find={this.find}
        writeClipboard={writeClipboard} bindVisibility={this.bindVisibility} register={this.register}
        shortcutCapture={this.shortcuts} Icon={ViewerIcon} version={READABLE_LOGS_VERSION} />;
    } },
  }];
  async onActivate() {
    this.stopShortcuts = this.shortcuts.bind(window);
    const ipc = ConfigurationIpc.createInstance(this);
    this.stopRecovery = ipc.listen(SETTINGS_RESET_COMPLETE, (_event, backup: string, status: SettingsStatus) => {
      configurationStore.attach(this, status);
      configurationStore.backedUp(backup);
    });
    configurationStore.bindReset(confirmed => ipc.invoke(SETTINGS_RESET, confirmed));
    try { configurationStore.attach(this, await ipc.invoke(SETTINGS_STATUS)); }
    catch (error) { configurationStore.failed(error); }
  }
  kubeObjectMenuItems = [{
    kind: 'Pod', apiVersions: ['v1'], components: {
      MenuItem: ({ object, toolbar }: { object: Renderer.K8sApi.Pod; toolbar?: boolean }) => {
        if (!object) return null;
        return <Renderer.Component.MenuItem onClick={() => {
          const cluster = Renderer.Catalog.getActiveCluster();
          if (!cluster) return;
          this.navigate(PAGE_ID, { clusterId: cluster.id, namespace: object.getNs(), pod: object.getName(), podUid: object.metadata.uid });
        }}>
          <Renderer.Component.Icon material="data_object" interactive={toolbar} tooltip="Readable logs" />
          <span className="title">Readable logs</span>
        </Renderer.Component.MenuItem>;
      },
    },
  }];
  async onDeactivate() {
    this.stopShortcuts?.();
    this.stopRecovery?.();
    const closing = [...this.viewers].map(dispose => dispose());
    this.viewers.clear();
    await Promise.all(closing);
  }
}
