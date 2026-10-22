import React from 'react';
import { Renderer } from '@freelensapp/extensions';
import { PAGE_ID, pageTarget, type PageParams } from '../adapter/freelens.ts';
import { Viewer } from './viewer.tsx';

export default class ReadableLogsRenderer extends Renderer.LensExtension {
  private viewers = new Set<() => void>();
  private register = (dispose: () => void) => {
    this.viewers.add(dispose);
    return () => { this.viewers.delete(dispose); };
  };
  clusterPages = [{
    id: PAGE_ID, params: { namespace: '', pod: '', podUid: '', clusterId: '' },
    components: { Page: ({ params }: { params: PageParams }) => <Viewer target={pageTarget(params)} register={this.register} /> },
  }];
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
    for (const dispose of this.viewers) dispose();
    this.viewers.clear();
  }
}
