# Freelens 1 and 2 integration contracts

## Evidence and scope

This compares extension `87e2a0b568ed68835badb4ca97173d9655db442a`
(`0.1.36`) with upstream Freelens 1.10.3,
`3da74415bff57a77c6e08cb5f538191ce87bac17` (the resolved `v1.10.3` tag),
and **only** the new `/home/max/work/freelens2` checkout at
`c02289f23422d9512544de3c506605296433e999` (`2.0.1-0`). The extension's
installed SDK and core package manifests both report `1.10.3`. The older
dock-tab draft is not evidence for this comparison. [Extension manifest][e-package],
[v1 SDK manifest][v1-package], [v2 app manifest][v2-package].

The findings below are versioned documentation, source, and type evidence;
**none is a v2 runtime pass**. No dependencies were installed, hosts built or
launched, or production code changed. Preserve the existing Pod-header action,
separate viewer page and [behavior specification][spec], including Find and
saved preferences within each host. Cross-version settings transfer is deferred;
Windows and macOS remain unverified.

Local references below use `E` for this extension baseline, `F1` for
`git -C /home/max/work/freelens show 3da74415:<path>`, and `F2` for
`/home/max/work/freelens2`. Every source link is commit-pinned.

## Loading, manifests and host libraries

| Surface | Freelens 1.10.3 | Freelens 2 source | Consequence |
| --- | --- | --- | --- |
| Discovery | Coerces `engines.freelens` to one major/minor and rebuilds `^major.minor`. | Same algorithm, using verkit. | `1.10.3` means the 1.10 caret range, not a patch pin. A union string does not produce cross-major discovery. Host-specific manifest generation/distribution needs a decision. |
| Entry exports | `require(absolutePath).default` in both processes. | Async import; renderer URL must serve ESM. Main accepts ESM or CJS and unwraps transpiled CJS default exports. | Current two CJS bundles cannot be reused unchanged. Main CJS initial loading remains allowed; only ESM supports development reload. |
| API access | Webpack exports become `global.LensExtensions`, `React`, `ReactDOM`, `Mobx`, etc. | SDK shim reads `globalThis.FreelensExtensionApi`; process-specific namespaces and singletons live there. `react-dom` maps to **`ReactDom`**. | Replace the existing build-time mapping by host. Wrong-process namespaces are undefined despite shared declarations. |
| Libraries | Extension compile pins React 17.0.2, MobX 6.13.7 and mobx-react 7.6.0; upstream core declares React 17, MobX `^6.15.0`, mobx-react `^7.6.0`. | Catalog pins React 19.3.1, MobX 7.0.6 and mobx-react 10.0.2. | Share host instances; compile against each host's types. Installed compile dependencies do not prove running-host versions. |

Evidence: E `scripts/build.mjs:4–32`, `package.json:8–39`;
F1/F2 `extensions/extension-discovery/is-compatible-extension/is-compatible-extension.ts:16–40`;
F1 `extension-loader/extension-loader.ts:390–413`, renderer/main entry exports and
Webpack `libraryTarget: "global"`; F2 loader `:882–917`, singleton maps and
catalog. [Build][e-build], [v1 gate][v1-gate], [v2 gate][v2-gate],
[v1 loader][v1-loader], [v2 loader][v2-loader], [v1 renderer][v1-renderer],
[v1 main][v1-main], [v1 webpack][v1-webpack], [v1 core manifest][v1-core],
[v2 singleton maps][v2-singletons], [v2 catalog][v2-catalog].

The normative v2 boundary is browser APIs plus the published extension API in
renderer, with Node/Electron retained in main. Renderer Node access remains
incidentally reachable at this revision, but can disappear within 2.x. Other
`@freelensapp/*` packages are private; the extension SDK bundles their types.
The extension's core-package override is therefore a v1 build concern.
Type checking is insufficient proof of either runtime namespace availability
or singleton identity. [API C1–C4][v2-contract].

The current store uses `makeObservable` annotations including `observable.ref`;
v2 requires `observableRef` instead. This is an actual touched surface, while
legacy decorator lowering is only relevant if decorators are introduced.
The v2 consumer types also require ES2024 libraries and modern package export
resolution; E currently uses ES2022 and `moduleResolution: node10`.
Shared React function components are plausible, but their React 19 types and
effects still need checking. [Store][e-store], [v2 MobX guide][v2-mobx],
[consumer floors][v2-floors], [extension tsconfig][e-tsconfig].

## Registration, navigation and log targets

Both hosts expose declarative `clusterPages` and `kubeObjectMenuItems` on
`Renderer.LensExtension`. V2 still renders the menu item with `object` and
`toolbar`; Pod details supplies `toolbar=true`. Consequently source supports
preserving the Pod-header action and separate page without dock integration.
V2 adds optional typed registration helpers; plain registrations remain valid.
[V1 renderer extension][v1-renderer-extension], [v2 menu props][v2-menu],
[v2 details toolbar][v2-details].

`navigate(pageId, params)` and registered `PageParam.get()` remain. V2 types
`components.Page` with general `Common.Types.PageComponentProps`, so E's
component requiring a named `PageParams` object needs a boundary conversion.
V2 uses its own router and provides no host React Router context. Preserve the
declared parameters `clusterId`, `namespace`, `pod`, `podUid`; do not infer a
target solely from whichever cluster later becomes active. E explicitly checks
the active cluster before requests and again after loading a Pod.
[V2 routing contract][v2-routing], [E registration][e-renderer],
[E target adapter][e-host].

V2 still exports `Renderer.Catalog.getActiveCluster()` and `Renderer.K8sApi.podsApi`.
`PodApi.getLogs(resource, query)` remains and gains an optional third
`AbortSignal`. `get()` returns a model or null; the log method returns a string,
substituting `""` for a nonstring response. E's bounded request options
(`tailLines`, timestamps, no follow/previous), UID checks, container lists and
instance identity can remain one behavior contract. Use the host cluster API,
which routes through Freelens' authenticated cluster proxy.
[Catalog][v2-active], [API export][v2-pods-export], [Pod API][v2-pods],
[KubeApi.get][v2-get], [HTTP contract][v2-http], [E adapter][e-host].

Errors still need normalization at the boundary: v2 JsonApi throws raw response
data for GET 403, and wraps other failures in `JsonApiErrorParsed`, whose
underlying `error` is TypeScript-private. E recursively looks through `error`,
`body`, and `status` to recognize 404. The source explains that existing access,
but does not make nested error representation a stable public guarantee. Check
404 versus denied/network failures on the evaluation host; never interpret any
failure as Pod deletion. [JsonApi error path][v2-errors], [E adapter][e-host].

## Settings, IPC, Find and lifecycle

`Common.Store.ExtensionStore` survives. In both source versions its default
directory is `<userData>/extension-store/<storeName>`; `loadExtension` creates
storage and synchronously calls `fromStore`, then tracks `toJSON` with a
host-MobX reaction. Main persists; renderer persistence is a no-op while
state is synchronized across processes. V2 additionally stops synchronization
before rebinding and registers a stop disposer on extension teardown.
[V1 store][v1-store], [v2 store][v2-store], [persistent storage][v2-storage],
[renderer persistence][v2-renderer-persist], [main persistence][v2-main-persist].

Two required adaptations follow from E's implementation: its shared store
imports `node:path` and the filesystem preflight/recovery module into renderer;
those operations must stay behind the main boundary on v2. Also, E's persistent
`syncing` flag skips `super.loadExtension()` after the first successful load;
following v2 disable, the SDK has stopped that subscription. Re-enabling must
re-establish synchronization. Keep validation, fallback, reset confirmation,
exclusive verified backup and read-only failure behavior shared; preserve
preflight-before-Conf construction. SDK sync options do not prevent Conf
construction side effects. No cross-host migration is specified here.
[E store][e-store], [E recovery][e-recovery], [v2 store][v2-store],
[v2 storage construction][v2-storage].

`Main.Ipc.handle`, `Renderer.Ipc.invoke`, `listen` and `broadcast` retain the
extension-prefixed channel model. Main RPC handlers still receive
`Electron.IpcMainInvokeEvent`; renderer listeners receive an **unknown** first
event argument. E already ignores renderer events. Broadcasts target the whole
extension, so sender ownership must continue to come from RPC, not broadcast
payloads. Handlers/listeners are extension-disposed; IPC subclass instances
are reset during teardown. [V1 IPC][v1-ipc], [v2 main IPC][v2-main-ipc],
[v2 renderer IPC][v2-renderer-ipc], [channel prefix][v2-ipc-prefix].

Find already runs Node `worker_threads` in main, using versioned shipped worker
source and `eval: true`; it does not need a renderer Web Worker or CSP change.
V2's Node-capable main and preserved IPC signatures support this route in
source. If main becomes ESM, E's `__dirname` resource lookup must change to a
path derived from the manifest. Preserve worker-version handshakes, sender and
frame ownership, cancellation and awaited termination; bundled source or type
success cannot prove Electron 44 frame navigation/deletion behavior.
[E main][e-main], [Find owner service][e-find], [worker][e-worker],
[v2 loading contract][v2-loading].

V2 extension teardown awaits `onDeactivate()` before registered disposers.
E already awaits viewer and worker shutdown and removes native listeners.
V2 development reload is full teardown plus import, not a component swap;
remaining timers/listeners accumulate if the extension fails to remove them.
V2's SDK store cleanup makes re-enable a meaningful separate check.
[Lifecycle implementation][v2-lifecycle], [reload guide][v2-reload],
[E renderer][e-renderer], [E main][e-main].

## Clipboard, visibility, shortcuts and CSS

E calls synchronous Electron `clipboard.writeText` from renderer and reports
success immediately. V2's guide requires browser clipboard promises instead;
the cluster iframe explicitly permits clipboard read/write. Thus copy completion
and rejection must become observable to the UI, or a main IPC copy operation
must supply that promise. Permission success still needs runtime evidence.
Preserve the original application/transport text, not serialized parsed JSON.
[E clipboard][e-clipboard], [E copy status][e-copy], [v2 replacements][v2-node],
[iframe permissions][v2-frames].

Visibility remains host-sensitive: v2 keeps cluster iframes mounted and hides
them with a class, while its root route remains `/cluster/:clusterId`.
E combines its owning BrowserWindow's visibility/minimization/root URL with
document visibility, using the RPC sender to choose the window. This is
source-compatible at the pin, but the route/DOM mechanism is implementation
evidence rather than a promised visibility API. Recheck hidden cluster,
different window, minimization and restore without using focus as eligibility.
[V2 frame visibility][v2-frames], [root route][v2-cluster-route],
[E native visibility][e-visibility], [E main][e-main].

Shortcuts use browser events and can remain shared, but their host interaction
needs validation: E installs an activation-time capture listener and suppresses
only owned commands; v2 native Logs also installs a window capture listener
for selected-text Find. DOM propagation alone does not prove registration
order. Retain input/composition/transient-menu guards and avoid modifying
native search. [E shortcuts][e-shortcuts], [v2 native Find listener][v2-native-find].

V2 loads one sibling `<entry>.css` or `style.css`; E currently embeds CSS text
in `<style>`. CSS output can be host-specific without duplicating view logic.
V2 removes legacy flex utilities; check the extension's host components and
styles against both hosts. [E build][e-build], [v2 CSS contract][v2-css].

## Producing the evaluation host

The pinned [development guide][v2-development] documents this recipe from
`/home/max/work/freelens2`:

```sh
pnpm i
pnpm build:di
pnpm build
pnpm build:app:dir
```

Use Node **24.22.1** (`.nvmrc`/`mise.toml`) and package-manager pin
**pnpm 12.15.0**. Mise's checked-in lock needs mise **2026.9.16+**. Linux
needs Electron's shared libraries; the guide gives `libnss3` as a Debian example,
not a complete Arch package list. Upstream says node-pty ships N-API prebuilts
and requires no C++/Python toolchain. The build downloads Electron and bundled
tools; binary content is checked against the committed lock. These are
documented prerequisites, not a completed machine audit.
[Tool pins][v2-tools], [package manager][v2-root-package],
[mise floor][v2-agent-tools], [binary build][v2-binaries].

On Linux x64, the packaged directory executable is
`freelens/dist/linux-unpacked/freelens`; `pnpm start` selects it.
The source catalogs/build config pin Electron **44.10.0**. `pnpm dev` is a
different development route with automatic Electron installation and CDP 9223;
it must not silently substitute for the requested built evaluation artifact.
Record commit, SDK declaration/bundle identity, runtime versions, extension
artifact hash and actual CDP target. Follow the extension's Linux UI playbook
before any subsequent build launch/installation or UI verification.
[App scripts][v2-package], [Electron build pin][v2-builder],
[development loop][v2-development].

## Remaining decisions and smallest useful experiment

Source establishes necessary host differences, without selecting the shared
seam, package strategy or broader supported version ranges.
Inference: pure core behavior does not require SDK duplication; host entry/build glue, library annotations,
settings filesystem work, clipboard and lifecycle bindings do require adaptation.
Reusable behavior assertions should take an explicit host target; stub/browser
passes cannot establish host integration.

Before committing to adapter interfaces, one disposable v2 contract fixture on
the actual pinned built host can answer the remaining feasibility questions:

1. Does the artifact load/register the Pod action and parameterized page with
   the host's React, and does a host-owned MobX reaction observe its changes?
2. Can a profile/layout edit persist through restart and disable/re-enable;
   does malformed JSON remain unchanged until confirmed backup/reset?
3. Does RPC preserve sender/frame identity, main Find worker execution and
   awaited cleanup across page close, navigation, re-enable and application quit?
4. Do exact copy with rejection handling, hidden-frame eligibility and local
   Find shortcuts work alongside native Logs with its search/selection unchanged?

These are integration experiments, not reopened product decisions. A fixture
does not replace the later full parity suite. Keep experiment evidence distinct
from existing Linux acceptance; do not add Windows/macOS suites or settings
migration gates.

[e-package]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/package.json
[spec]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/docs/specification.md
[e-build]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/scripts/build.mjs#L4-L32
[e-store]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/src/adapter/configuration-store.ts#L1-L45
[e-tsconfig]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/tsconfig.json
[e-renderer]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/src/renderer/index.tsx#L12-L63
[e-host]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/src/adapter/freelens.ts#L29-L79
[e-recovery]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/src/adapter/configuration-file.ts#L7-L49
[e-main]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/src/main.ts#L22-L83
[e-find]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/src/main/find-service.ts#L41-L124
[e-worker]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/src/worker/find.ts
[e-clipboard]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/src/adapter/clipboard.ts
[e-copy]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/src/renderer/viewer.tsx#L617-L623
[e-visibility]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/src/adapter/window-visibility.ts#L14-L38
[e-shortcuts]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/src/renderer/local-shortcuts.ts#L22-L99
[v1-package]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/extensions/package.json
[v1-gate]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/extensions/extension-discovery/is-compatible-extension/is-compatible-extension.ts#L16-L40
[v1-loader]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/extensions/extension-loader/extension-loader.ts#L390-L413
[v1-renderer]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/freelens/src/renderer/index.ts#L72-L85
[v1-main]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/freelens/src/main/index.ts#L49-L57
[v1-webpack]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/freelens/webpack/renderer.ts#L30-L37
[v1-core]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/package.json#L141-L156
[v1-renderer-extension]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/extensions/lens-renderer-extension.ts#L55-L145
[v1-store]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/extensions/base-extension-store.ts#L77-L116
[v1-ipc]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/extensions/ipc/ipc-main.ts#L40-L89
[v2-package]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/freelens/package.json#L1-L65
[v2-gate]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/packages/core/src/extensions/extension-discovery/is-compatible-extension/is-compatible-extension.ts#L16-L40
[v2-loader]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/packages/core/src/extensions/extension-loader/extension-loader.ts#L882-L917
[v2-singletons]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/packages/core/src/extensions/api-globals/renderer-singletons.ts#L39-L78
[v2-catalog]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/pnpm-workspace.yaml#L7-L17
[v2-contract]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/docs/extensions/api.md#c1-packaging-and-publication
[v2-loading]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/docs/extensions/api.md#c4-module-format-and-loading
[v2-mobx]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/docs/extensions/migrating-from-v1.md#mobx-7-and-mobx-react-10-standard-decorators-only
[v2-floors]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/docs/extensions/api.md#c13-consumer-toolchain-floors
[v2-menu]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/packages/core/src/renderer/components/kube-object-menu/kube-object-menu-registration.ts#L12-L35
[v2-details]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/packages/core/src/renderer/components/kube-object-details/kube-object-details.tsx#L49-L61
[v2-routing]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/docs/extensions/api.md#c9-routing
[v2-active]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/packages/core/src/extensions/renderer-api/catalog.ts#L127-L146
[v2-pods-export]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/packages/core/src/extensions/renderer-api/k8s-api.ts#L92
[v2-pods]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/packages/utility-features/kube-api/src/endpoints/pod.api.ts#L91-L102
[v2-get]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/packages/utility-features/kube-api/src/kube-api.ts#L650-L664
[v2-http]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/docs/extensions/api.md#c12-http
[v2-errors]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/packages/utility-features/json-api/src/json-api.ts#L107-L267
[v2-store]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/packages/core/src/extensions/base-extension-store.ts#L82-L128
[v2-storage]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/packages/core/src/features/persistent-storage/common/create.injectable.ts#L109-L195
[v2-renderer-persist]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/packages/core/src/features/persistent-storage/renderer/persist-state-to-config.injectable.ts
[v2-main-persist]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/packages/core/src/features/persistent-storage/main/persist-state-to-config.injectable.ts
[v2-main-ipc]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/packages/core/src/extensions/ipc/ipc-main.ts#L25-L89
[v2-renderer-ipc]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/packages/core/src/extensions/ipc/ipc-renderer.ts#L20-L74
[v2-ipc-prefix]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/packages/core/src/extensions/ipc/ipc-registrar.ts#L17-L31
[v2-lifecycle]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/packages/core/src/extensions/lens-extension.ts#L97-L126
[v2-reload]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/docs/extensions/migrating-from-v1.md#the-development-loop
[v2-node]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/docs/extensions/migrating-from-v1.md#node-and-electron-in-the-renderer
[v2-frames]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/packages/core/src/renderer/components/cluster-manager/cluster-frame-handler.ts#L57-L145
[v2-cluster-route]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/packages/core/src/common/front-end-routing/routes/cluster-view/cluster-view-route.injectable.ts#L15
[v2-native-find]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/packages/core/src/renderer/components/dock/logs/search.tsx#L146-L164
[v2-css]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/docs/extensions/api.md#c10-styling-and-css
[v2-development]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/DEVELOPMENT.md#build-from-the-source
[v2-tools]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/mise.toml
[v2-root-package]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/package.json#L84-L87
[v2-agent-tools]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/AGENTS.md#development-tools-mise
[v2-binaries]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/AGENTS.md#bundled-binary-versions
[v2-builder]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/freelens/electron-builder.yml#L3
