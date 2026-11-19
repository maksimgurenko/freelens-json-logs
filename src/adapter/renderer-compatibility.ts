// This preflight runs before the entry imports any SDK-dependent classes.
import { requireHostFunctions, requireStoreApi } from './host-compatibility.ts';

const host = globalThis.FreelensExtensionApi;
requireStoreApi(host);
const renderer = host?.Renderer;
const react = host?.React;
requireHostFunctions({
  'Renderer.LensExtension': renderer?.LensExtension,
  'Renderer.LensExtension.navigate': renderer?.LensExtension?.prototype?.navigate,
  'Renderer.Ipc': renderer?.Ipc,
  'Renderer.Ipc.createInstance': renderer?.Ipc?.createInstance,
  'Renderer.Catalog.getActiveCluster': renderer?.Catalog?.getActiveCluster,
  'React.createElement': react?.createElement,
  'React.memo': react?.memo,
  'React.useEffect': react?.useEffect,
  'React.useLayoutEffect': react?.useLayoutEffect,
  'React.useMemo': react?.useMemo,
  'React.useRef': react?.useRef,
  'React.useState': react?.useState,
});

const componentMarkers = new Set([Symbol.for('react.memo'), Symbol.for('react.forward_ref'), Symbol.for('react.lazy')]);
for (const name of ['Icon', 'MenuItem'] as const) {
  const component: unknown = renderer?.Component?.[name];
  if (typeof component === 'function') continue;
  if (component && typeof component === 'object' && '$$typeof' in component &&
      typeof component.$$typeof === 'symbol' && componentMarkers.has(component.$$typeof)) continue;
  throw new Error(`Readable logs cannot start. Missing Freelens interface: Renderer.Component.${name}`);
}

export function requirePodApi() {
  let get, getLogs;
  try {
    const pods = renderer?.K8sApi?.podsApi;
    get = pods?.get;
    getLogs = pods?.getLogs;
  } catch (cause) {
    throw new Error('Readable logs cannot start. Freelens interface Renderer.K8sApi.podsApi is unavailable.', { cause });
  }
  requireHostFunctions({
    'Renderer.K8sApi.podsApi.get': get,
    'Renderer.K8sApi.podsApi.getLogs': getLogs,
  });
}
