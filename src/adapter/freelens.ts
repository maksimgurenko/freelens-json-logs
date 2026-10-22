import { Renderer } from '@freelensapp/extensions';
import { TAIL_LINES } from '../core/snapshot.ts';
import type { SnapshotPort } from '../core/session.ts';
import type { LogTarget } from '../core/target.ts';
import { LogRequests } from '../core/requests.ts';

export const PAGE_ID = 'readable-logs';
export const PACKAGE_VERSION = '0.1.2';
// Retain outstanding same-target guards across page unmount/reopen and disable.
export const freelensRequests = new LogRequests();
export type PageParams = { namespace: Renderer.Navigation.PageParam<string>; pod: Renderer.Navigation.PageParam<string>; podUid: Renderer.Navigation.PageParam<string>; clusterId: Renderer.Navigation.PageParam<string> };

export function pageTarget(params: PageParams): LogTarget {
  const cluster = Renderer.Catalog.getActiveCluster();
  return { clusterId: params.clusterId.get(), clusterName: cluster?.name ?? '',
    namespace: params.namespace.get(), podName: params.pod.get(), podUid: params.podUid.get() };
}
function assertCluster(target: LogTarget) {
  if (!target.clusterId || target.clusterId !== Renderer.Catalog.getActiveCluster()?.id) {
    throw new Error('The selected cluster has changed. Reopen Readable logs from the Pod in the intended cluster.');
  }
}
export const freelensPort: SnapshotPort = {
  async loadPod(target) {
    assertCluster(target);
    if (!target.namespace || !target.podName || !target.podUid) throw new Error('Pod identity is missing. Open Readable logs from a Pod details header.');
    const pod = await Renderer.K8sApi.podsApi.get({ namespace: target.namespace, name: target.podName });
    assertCluster(target);
    if (!pod?.metadata.uid) throw new Error('The original Pod is no longer available.');
    return { uid: pod.metadata.uid,
      regular: (pod.spec.containers ?? []).map(container => container.name),
      init: (pod.spec.initContainers ?? []).map(container => container.name),
      ephemeral: (pod.spec.ephemeralContainers ?? []).map(container => container.name),
      defaultContainer: pod.metadata.annotations?.['kubectl.kubernetes.io/default-container'] };
  },
  async readLogs(target, container) {
    assertCluster(target);
    return Renderer.K8sApi.podsApi.getLogs({ namespace: target.namespace, name: target.podName }, {
      container, tailLines: TAIL_LINES, timestamps: true, follow: false, previous: false,
    });
  },
};
