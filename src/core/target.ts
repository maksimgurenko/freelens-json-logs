export interface Container { name: string; kind: 'regular' | 'init' | 'ephemeral' }
export interface PodDescription {
  uid: string;
  regular: string[];
  init: string[];
  ephemeral: string[];
  defaultContainer?: string;
}
export interface LogTarget {
  clusterId: string;
  clusterName: string;
  namespace: string;
  podName: string;
  podUid: string;
}
export function initialContainer(pod: PodDescription): string {
  return pod.regular.find(name => name === pod.defaultContainer) ?? pod.regular[0] ?? '';
}
export function containerChoices(pod: PodDescription): Container[] {
  return [
    ...pod.regular.map(name => ({ name, kind: 'regular' as const })),
    ...pod.init.map(name => ({ name, kind: 'init' as const })),
    ...pod.ephemeral.map(name => ({ name, kind: 'ephemeral' as const })),
  ];
}
