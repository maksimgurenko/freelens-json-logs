import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import Module from 'node:module';
import { RendererExtensionStub } from '../tests/freelens-renderer-stub.mjs';

const require = createRequire(import.meta.url);
const testedVersion = '2.0.0';
const futureVersion = '2.7.1';

export async function checkPackageCompatibility(mainEntry, rendererEntry, settingsDirectory) {
  const originalHost = globalThis.FreelensExtensionApi;
  const originalWindow = globalThis.window;
  const originalLoad = Module._load;
  const originalWarn = console.warn;
  const warnings = [];
  const handlers = new Map();
  let bindings = 0, workers = 0, invocations = 0, scenario = 0;
  class MainIpc {
    static createInstance() { return new this(); }
    handle(channel, handler) { handlers.set(channel, handler); }
    broadcast() {}
  }
  class RendererIpc {
    static createInstance() { return new this(); }
    listen() { return () => {}; }
    async invoke(channel, ...args) {
      invocations++;
      if (!handlers.has(channel)) {
        const scoped = `extensions@freelens-readable-logs-v2:${channel}`;
        throw new Error(`Error invoking remote method '${scoped}': Error: No handler registered for '${scoped}'`);
      }
      return handlers.get(channel)({}, ...args);
    }
  }
  class Store {
    static getInstanceOrCreate() { return new this(); }
    cwd() { return settingsDirectory; }
    loadExtension() { bindings++; }
  }
  const host = version => ({
    Common: { Store: { ExtensionStore: Store }, Util: { getAppVersion: () => version } },
    Main: { LensExtension: class {}, Ipc: MainIpc },
    Renderer: {
      LensExtension: RendererExtensionStub, Ipc: RendererIpc,
      Catalog: { getActiveCluster: () => ({ id: 'fixture-cluster' }) },
      K8sApi: { podsApi: { get() {}, getLogs() {} } },
      Component: { Icon() {}, MenuItem() {} },
    },
    Mobx: require('mobx'), React: require('react'), ReactJsxRuntime: require('react/jsx-runtime'),
  });
  const loadMain = () => {
    delete require.cache[require.resolve(mainEntry)];
    return new (require(mainEntry).default)();
  };
  const loadRenderer = async () => {
    const url = pathToFileURL(rendererEntry);
    url.searchParams.set('scenario', ++scenario);
    return new (await import(url.href)).default();
  };
  const setHost = version => {
    handlers.clear();
    bindings = workers = invocations = 0;
    warnings.length = 0;
    return globalThis.FreelensExtensionApi = host(version);
  };
  try {
    globalThis.window = new EventTarget();
    console.warn = (...args) => warnings.push(args.join(' '));
    Module._load = function(name, ...args) {
      if (name === 'electron') return { BrowserWindow: { fromWebContents() {} } };
      if (name === 'node:worker_threads') return { Worker: class { constructor() { workers++; } } };
      return originalLoad.call(this, name, ...args);
    };
    for (const version of [testedVersion, futureVersion]) {
      const api = setHost(version);
      if (version === futureVersion) api.Renderer.Component.MenuItem = api.React.forwardRef(() => null);
      const main = loadMain();
      const renderer = await loadRenderer();
      try {
        if (version === testedVersion) await main.onActivate();
        assert.equal(bindings, 0, 'Main initialized settings before the renderer checked its SDK');
        assert.deepEqual(renderer.clusterPages, []);
        const activating = renderer.onActivate();
        if (version === futureVersion) {
          assert.equal(invocations, 1, 'Expected renderer to request status before main starts');
          await main.onActivate();
        }
        await activating;
        assert.equal(invocations, version === futureVersion ? 2 : 1);
        assert.equal(bindings, 2, 'Both processes must bind settings on a compatible host');
        const page = renderer.clusterPages[0].components.Page;
        assert.equal(typeof page, 'function');
        assert.doesNotThrow(() => require('mobx-react').observer(page));
        assert.equal(renderer.kubeObjectMenuItems.length, 1);
        let destination;
        renderer.navigate = (...args) => { destination = args; };
        const { MenuItem } = renderer.kubeObjectMenuItems[0].components;
        const action = MenuItem({ object: { metadata: { namespace: 'fixture', name: 'pod', uid: 'pod-uid' } } });
        action.props.onClick();
        assert.deepEqual(destination, ['readable-logs', { clusterId: 'fixture-cluster', namespace: 'fixture', pod: 'pod', podUid: 'pod-uid' }]);
        assert.equal(workers, 0, 'Find must stay idle until requested');
        if (version === testedVersion) assert.deepEqual(warnings, []);
        else {
          assert.equal(warnings.length, 1);
          assert.match(warnings[0], /2\.7\.1.*untested/i);
        }
      } finally {
        await renderer.onDeactivate();
        await main.onDeactivate();
      }
    }

    const rootHost = setHost(testedVersion);
    const rootMain = loadMain();
    await rootMain.onActivate();
    // In the real top-level window, the lazily injected Pod API throws on access.
    rootHost.Renderer.K8sApi.podsApi = new Proxy({}, {
      get() { throw new Error('Pod API is only available in cluster frames'); },
    });
    globalThis.window.top = globalThis.window;
    try {
      const rootRenderer = await loadRenderer();
      await rootRenderer.onActivate();
      assert.deepEqual(rootRenderer.clusterPages, []);
      assert.deepEqual(rootRenderer.kubeObjectMenuItems, []);
      assert.equal(invocations, 0);
      assert.equal(bindings, 0);
      assert.equal(workers, 0);
      await rootRenderer.onDeactivate();
    } finally {
      delete globalThis.window.top;
      await rootMain.onDeactivate();
    }

    const missingRenderer = setHost(futureVersion);
    const main = loadMain();
    await main.onActivate();
    delete missingRenderer.Renderer.K8sApi.podsApi.getLogs;
    try {
      const renderer = await loadRenderer();
      await assert.rejects(renderer.onActivate(), /Renderer\.K8sApi\.podsApi\.getLogs/);
      assert.deepEqual(renderer.clusterPages, []);
      assert.deepEqual(renderer.kubeObjectMenuItems, []);
      assert.equal(invocations, 0);
      assert.equal(bindings, 0);
      assert.equal(workers, 0);
    } finally { await main.onDeactivate(); }

    const missingMain = setHost(futureVersion);
    missingMain.Main.Ipc = class extends MainIpc { handle = undefined; };
    const incomplete = loadMain();
    await assert.rejects(async () => incomplete.onActivate(), /Main\.Ipc\.handle/);
    const renderer = await loadRenderer();
    try {
      await assert.rejects(renderer.onActivate(), /main.*readable-logs-settings-status/i);
      assert.deepEqual(renderer.clusterPages, []);
      assert.deepEqual(renderer.kubeObjectMenuItems, []);
      assert.equal(bindings, 0);
      assert.equal(workers, 0);
    } finally { await renderer.onDeactivate(); }
  } finally {
    Module._load = originalLoad;
    console.warn = originalWarn;
    globalThis.FreelensExtensionApi = originalHost;
    globalThis.window = originalWindow;
  }
  return { testedVersion, futureVersion, missingRenderer: 'podsApi.getLogs', missingMain: 'Ipc.handle' };
}
