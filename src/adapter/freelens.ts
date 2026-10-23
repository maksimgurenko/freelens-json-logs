import { Renderer } from '@freelensapp/extensions';
import { TAIL_LINES } from '../core/snapshot.ts';
import type { SnapshotPort } from '../core/session.ts';
import type { LogTarget } from '../core/target.ts';
import { LogRequests } from '../core/requests.ts';
import { observe } from '../core/observe.ts';
import { VISIBILITY_REQUEST, type VisibilityChannel } from './visibility.ts';

class VisibilityIpc extends Renderer.Ipc {}
export function visibilityChannel(extension: Renderer.LensExtension): VisibilityChannel {
  const ipc = VisibilityIpc.createInstance(extension);
  return {
    listen: (channel, received) => ipc.listen(channel, (_event, selected: string | null) => received(selected)),
    broadcast: (channel, ...args) => {
      if (channel === VISIBILITY_REQUEST) {
        void ipc.invoke(channel, ...args).catch(error => console.error('Unable to observe Readable logs window visibility', error));
      } else ipc.broadcast(channel, ...args);
    },
  };
}
export const PAGE_ID = 'readable-logs';
export const PACKAGE_VERSION = '0.1.9';
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
    let pod: Renderer.K8sApi.Pod | null;
    try {
      pod = await Renderer.K8sApi.podsApi.get({ namespace: target.namespace, name: target.podName });
    } catch (error) {
      // Freelens wraps Kubernetes Status under error/body; only an observed 404
      // means deletion. Denial/network failure must never imply a missing Pod.
      if (notFound(error)) return null;
      throw error;
    }
    assertCluster(target);
    if (!pod?.metadata.uid) return null;
    return { uid: pod.metadata.uid,
      regular: (pod.spec.containers ?? []).map(container => container.name),
      init: (pod.spec.initContainers ?? []).map(container => container.name),
      ephemeral: (pod.spec.ephemeralContainers ?? []).map(container => container.name),
      defaultContainer: pod.metadata.annotations?.['kubectl.kubernetes.io/default-container'],
      instances: Object.fromEntries([
        ...(pod.status?.containerStatuses ?? []), ...(pod.status?.initContainerStatuses ?? []),
        ...(pod.status?.ephemeralContainerStatuses ?? []),
      ].map(status => [status.name, { restarts: status.restartCount, id: status.containerID || undefined }])) };
  },
  watchPod(target, received, failed) {
    return observe(() => freelensPort.loadPod(target), received, failed);
  },
  async readLogs(target, container) {
    assertCluster(target);
    return Renderer.K8sApi.podsApi.getLogs({ namespace: target.namespace, name: target.podName }, {
      container, tailLines: TAIL_LINES, timestamps: true, follow: false, previous: false,
    });
  },
};

function notFound(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const value = error as Record<string, unknown>;
  return value.code === 404 || value.statusCode === 404 || value.reason === 'NotFound'
    || ['error', 'body', 'status'].some(key => notFound(value[key]));
}
