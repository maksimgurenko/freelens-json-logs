import React from 'react';
import { Renderer } from '@freelensapp/extensions';
import { PAGE_ID, pageTarget, visibilityChannel, type PageParams } from '../adapter/freelens.ts';
import { Viewer } from './viewer.tsx';
import { configurationStore } from '../adapter/configuration-store.ts';
import { SETTINGS_RESET, SETTINGS_RESET_COMPLETE } from '../adapter/configuration-ipc.ts';
import { ShortcutCapture } from './local-shortcuts.ts';

class ConfigurationIpc extends Renderer.Ipc {}

export default class ReadableLogsRenderer extends Renderer.LensExtension {
  private visibility = visibilityChannel(this);
  private viewers = new Set<() => void>();
  private stopRecovery?: () => void;
  private shortcuts = new ShortcutCapture();
  private stopShortcuts?: () => void;
  private register = (dispose: () => void) => {
    this.viewers.add(dispose);
    return () => { this.viewers.delete(dispose); };
  };
  clusterPages = [{
    id: PAGE_ID, params: { namespace: '', pod: '', podUid: '', clusterId: '' },
    components: { Page: ({ params }: { params: PageParams }) => {
      const target = pageTarget(params);
      return <Viewer key={JSON.stringify([target.clusterId, target.namespace, target.podName, target.podUid])}
        target={target} register={this.register} visibility={this.visibility} preferences={configurationStore} shortcutCapture={this.shortcuts} />;
    } },
  }];
  onActivate() {
    this.stopShortcuts = this.shortcuts.bind(window);
    const ipc = ConfigurationIpc.createInstance(this);
    this.stopRecovery = ipc.listen(SETTINGS_RESET_COMPLETE, (_event, backup: string) => {
      configurationStore.loadExtension(this);
      configurationStore.backedUp(backup);
    });
    configurationStore.bindReset(confirmed => ipc.invoke(SETTINGS_RESET, confirmed));
    try { configurationStore.loadExtension(this); }
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
  onDeactivate() {
    this.stopShortcuts?.();
    this.stopRecovery?.();
    for (const dispose of this.viewers) dispose();
    this.viewers.clear();
  }
}
