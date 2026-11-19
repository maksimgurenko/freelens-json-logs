import { Renderer } from '@freelensapp/extensions';
import { TAIL_LINES } from '../core/snapshot.ts';
import type { SnapshotPort } from '../core/session.ts';
import type { LogTarget } from '../core/target.ts';
import { observe } from '../core/observe.ts';
import { bindVisibility, VISIBILITY_CHANGED, VISIBILITY_REQUEST, VISIBILITY_STOP, type VisibilityChannel } from './visibility.ts';

export function viewerVisibility(ipc: Renderer.Ipc) {
  // The SDK retains the listener disposer until disable. Keep viewer callbacks
  // in a local map so their elements are released as soon as the viewer closes.
  const receivers = new Map<string, (selected: string | null) => void>();
  const stop = ipc.listen(VISIBILITY_CHANGED, (_event, reply: string, selected: string | null) => receivers.get(reply)?.(selected));
  const channel: VisibilityChannel = {
    listen: (reply, received) => {
      receivers.set(reply, received);
      return () => { receivers.delete(reply); };
    },
    request: (clusterId, reply) => {
      void ipc.invoke(VISIBILITY_REQUEST, clusterId, reply).catch(error => console.error('Unable to observe Readable logs window visibility', error));
    },
    stop: reply => { void ipc.invoke(VISIBILITY_STOP, reply).catch(() => { /* Main may already be deactivating. */ }); },
  };
  return {
    bind: (element: HTMLElement, clusterId: string, active: (value: boolean) => void) =>
      bindVisibility(element, clusterId, channel, active),
    dispose() {
      receivers.clear();
      stop();
    },
  };
}

export const PAGE_ID = 'readable-logs';
export function pageTarget(params: Record<string, Renderer.Navigation.PageParam<unknown>>): LogTarget {
  const param = (name: string) => {
    const value = params[name]?.get();
    return typeof value === 'string' ? value : '';
  };
  const clusterId = param('clusterId');
  const activeCluster = Renderer.Catalog.getActiveCluster();
  return { clusterId, clusterName: activeCluster?.id === clusterId ? activeCluster.name : '',
    namespace: param('namespace'), podName: param('pod'), podUid: param('podUid') };
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
    return { uid: pod.metadata.uid, labels: Object.fromEntries(Object.entries(pod.metadata.labels ?? {}).filter((entry): entry is [string, string] => typeof entry[1] === 'string')),
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
