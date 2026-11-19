// This preflight runs before the entry imports any SDK-dependent classes.
import { requireHostFunctions, requireStoreApi } from './host-compatibility.ts';

const host = globalThis.FreelensExtensionApi;
requireStoreApi(host);
const store = host?.Common?.Store?.ExtensionStore;
requireHostFunctions({
  'Common.Store.ExtensionStore.cwd': store?.prototype && Reflect.get(store.prototype, 'cwd'),
  'Common.Util.getAppVersion': host?.Common?.Util?.getAppVersion,
  'Main.LensExtension': host?.Main?.LensExtension,
  'Main.Ipc': host?.Main?.Ipc,
  'Main.Ipc.createInstance': host?.Main?.Ipc?.createInstance,
});

const testedVersion = '2.0.0';
const version = host.Common.Util.getAppVersion();
if (version !== testedVersion) {
  console.warn(`Readable logs: Freelens ${version} is untested. The tested host version is ${testedVersion}.`);
}
