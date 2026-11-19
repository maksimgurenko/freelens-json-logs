export function requireHostFunctions(interfaces: Record<string, unknown>) {
  const missing = Object.entries(interfaces).filter(([, value]) => typeof value !== 'function').map(([name]) => name);
  if (missing.length) throw new Error(`Readable logs cannot start. Missing Freelens interfaces: ${missing.join(', ')}`);
}

export function requireStoreApi(host: typeof globalThis.FreelensExtensionApi | undefined) {
  const store = host?.Common?.Store?.ExtensionStore;
  const mobx = host?.Mobx;
  requireHostFunctions({
    'Common.Store.ExtensionStore': store,
    'Common.Store.ExtensionStore.getInstanceOrCreate': store?.getInstanceOrCreate,
    'Common.Store.ExtensionStore.loadExtension': store?.prototype?.loadExtension,
    'Mobx.action': mobx?.action,
    'Mobx.makeObservable': mobx?.makeObservable,
    'Mobx.observable': mobx?.observable,
    'Mobx.observableRef': mobx?.observableRef,
    'Mobx.reaction': mobx?.reaction,
  });
}
