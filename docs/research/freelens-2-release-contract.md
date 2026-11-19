# Readable Container Logs on released Freelens 2.0.0

The released SDK retains the Pod action, separate cluster Page, Pod API,
extension store and scoped RPC that the extension needs. The renderer must
move to browser ESM. The integration choices with observable consequences are
snapshot cancellation, owner-window visibility, settings recovery, exact copy,
and waiting for Find teardown. [Research question][ticket] · [Upstream API][api] · [Porting guide][guide]

## Scope and evidence

- **Host and SDK.** Upstream tag `v2.0.0` resolves to
  `b9b53e16056578c5407312eba5823a089972f6d5`. I unpacked the published
  `@freelensapp/extensions@2.0.0` npm tarball and confirmed its SHA-512 against
  the registry integrity value. Its exports are the rolled-up declaration and
  an ESM shim reading `globalThis.FreelensExtensionApi`. The tagged host pins
  React/React DOM 19.3.1, MobX 7.0.6, mobx-react 10.0.2 and Electron 44.10.0.
  The release publishes Linux amd64 and arm64 artifacts. For example, the amd64
  AppImage checksum file and release asset metadata both identify SHA-256
  `372a019765170ad420b0224d653d488ebebc41faa972052fa3df1337c2cb11d1`.
  [Release][release] · [AppImage checksum][appimage-sha] · [SDK registry record][sdk] · [SDK tarball][sdk-tar] · [Tagged dependency catalog][host-deps]
- **Extension.** Production source below is the committed `11bae59` tree.
  The behavioral reference is the specification at `87e2a0b`, including its
  completed Linux Find acceptance on Freelens 1.10.3. Two scope inputs for
  the port are a fresh v2 settings store and final acceptance against the
  official 2.0.0 Linux release. Windows and macOS remain unverified.
  [Planning map][map] · [Production commit][production] · [Behavioral specification][baseline]
- **Evidence limits.** The earlier fixture ran on a local `2.0.1-0` build
  (`c02289f23422d9512544de3c506605296433e999`). Its observations appear below
  alongside the relevant seams. This investigation inspected source, npm
  artifacts and release metadata. Runtime results for the final production
  archive on the official Linux build are still due in the acceptance ticket.
  [Fixture report][fixture] · [Acceptance question][acceptance]

## Pod action and separate viewer

- **Current wiring and released surface.** The Kubernetes `Pod`/`v1` entry in
  `Renderer.LensExtension.kubeObjectMenuItems` supplies a `MenuItem` and
  `Icon`. Tagged host code renders the registered action with `{object,
  toolbar}`, including `toolbar: true` from the Pod details header. The
  released SDK accepts the existing kind/version registration and exposes
  `Renderer.K8sApi.menuItemFor(Renderer.K8sApi.Pod, …)` as a typed way to
  express it. The renderer entry can keep the actual registrations and pass
  extension-owned dependencies to the viewer through their closures.
  [Current registration][current-entry] · [C6 registrations][api-registration] · [Details header][host-object-details] · [Menu props][host-object-menu]
- **Route and identity.** Keep `clusterPages` and
  `this.navigate(PAGE_ID, {clusterId, namespace, pod, podUid})`.
  Declare all four params, read them with `params.<name>.get()` and keep the
  existing viewer key so target changes remount the owner. The released
  `Page` callback receives only `params`, with a generic host registration
  type. The host wraps it in `observer`; register a plain wrapper. The
  `navigate` implementation uses registered routes and parameter serializers,
  so exercise the real action and route instead of inferring navigation from
  a successful import. The fixture opened this route with all four values
  and rendered using host React. Its initially double-wrapped Page failed
  registration. [Current Page and action][current-entry] · [C9 routing][api-routing] · [Route registration][host-route-registrator] · [Instance navigation][host-navigation] · [Fixture observations][fixture-observations]

## Pod metadata, log snapshots and eligibility

- **Metadata and logs.** `Renderer.K8sApi.podsApi` is still the cluster-frame
  API. The published types retain `get({ namespace, name }, query?)` returning
  `Pod | null` and `getLogs({ namespace, name }, query?, signal?)` returning
  `string`. Keep the adapter's active cluster check, UID and metadata mapping,
  regular/init/ephemeral containers, default annotation, labels, restart counts
  and container IDs. Its snapshot query requests `tailLines: 1000`, timestamps,
  current container instance and no follow. The extension still owns polling,
  stale-result suppression, exact transport-line handling and the 1,000-record
  and 5 MiB recent log window. The log endpoint addresses a Pod by name.
  Metadata and log reads are separate requests, so UID checking and observed
  restart detection remain extension behavior.
  [Current Pod and logs adapter][current-pod] · [Renderer exports][host-pods-export] · [Pod metadata API][host-pod-model] · [Pod get][host-kube-get] · [Pod log get][host-log] · [Recent-window contract][baseline-window]
- **Cancellation and responses.** The optional log `AbortSignal` is new
  relative to 1.10.3. Tagged code forwards it to the JSON API request. Metadata
  `get` lacks an equivalent signal parameter. The existing one-outstanding-read
  guard waits for a prior operation to settle, and a 15-second message leaves
  the read pending. The port can preserve those semantics as written. If it
  uses cancellation, specify the exact triggers and prove actual settlement,
  the same-target guard, and stale reply handling. The tagged client reads
  response text and tries JSON parsing before `getLogs` returns a string or
  an empty string for a non-string result, a behavior also present in 1.10.3.
  Verify the actual timestamped snapshot text, including CR, LF, blank lines,
  whitespace and Unicode. For metadata, the tagged client can throw a JSON
  error wrapper or a raw 403 payload. Verify Kubernetes 404, denial and
  network failure separately before relying on the current nested error
  inspection. [Current request pool][current-requests] · [Snapshot lifecycle][baseline-window] · [Released HTTP path][host-json] · [1.10.3 log get][v1-log] · [1.10.3 HTTP path][v1-json]
- **Owning window.** The current eligibility adapter asks main about the
  requesting `BrowserWindow`, checks visibility/minimization and the root
  `/cluster/<id>` route, and combines that result with document visibility.
  Losing keyboard focus alone keeps an otherwise eligible view active. In the
  released source, the host retains cluster iframes and hides them with a
  CSS class. `Renderer.Catalog.getActiveCluster()` reports catalog context.
  The reviewed exports supply no owning-window/selected-frame eligibility
  signal. The release source confirms the root route and its internal
  cluster-visibility emitter. The route test in our adapter is a host
  implementation dependency, and a matched route can precede iframe readiness.
  A main Electron adapter using the IPC sender is a continuation to validate.
  The fixture observed an unfocused active cluster and then a retained,
  ineligible cluster after navigation to Catalog. The release gate still
  needs cluster switches, hide/minimize/restore, close/reopen, other windows
  where applicable, and visibility subscription cleanup.
  [Current renderer eligibility][current-visibility] · [Current native window check][current-window] · [Cluster catalog source][host-catalog] · [Root route][host-cluster-route] · [Retained iframe selection][host-frames] · [Fixture observations][fixture-observations]

## Settings, recovery and identity

- **Binding.** The current shared store imports `node:path` and the
  filesystem recovery module, pulling Node into the renderer. Keep the
  browser-safe `ViewerPreferences` and schema/default/profile model.
  `Common.Store.ExtensionStore` still exposes `loadExtension`,
  `fromStore` and `toJSON`. The v2 implementation stops old synchronization
  before rebinding and registers cleanup on disable. Remove the persistent
  `syncing` shortcut and bind on each successful activation. Main applies
  durable writes, while the renderer SDK implementation uses the common
  storage loader, which reads through Conf at startup. This makes the
  main preflight result a gate for store initialization in both processes.
  [Current combined store][current-settings] · [Viewer model][current-configuration] · [Released ExtensionStore][host-settings] · [Loader and sync][host-storage] · [Conf construction][host-conf] · [Main writer][host-storage-main] · [Renderer writer][host-storage-renderer]
- **Recovery.** Main can retain the existing preflight and exact backup
  logic. A malformed, unreadable or unsupported v2 file must preserve
  its bytes, surface the problem, inhibit saves and leave the viewer usable
  with built-in Default and Side inspection. Avoid initializing either
  SDK store until main has confirmed healthy data. A canceled reset leaves
  the file untouched. Confirmed reset requires the exclusive, verified
  backup before replacing the primary file, and then rebinds and resumes
  saving in both processes. The prerelease fixture observed healthy sync
  across restart and re-enable, plus byte preservation through canceled
  reset and an exact backup on confirmed reset. The production recovery
  UI, fresh-store startup ordering, unsupported schema, backup failure and
  recovery across multiple renderer frames still need released-host evidence.
  [Current preflight and backup][current-reset] · [Saved-settings contract][baseline-settings] · [Fixture observations][fixture-observations]
- **Package name and file path are independent choices.** The release keys
  the installed extension, enabled state and scoped IPC by `manifest.name`.
  Freelens 1.10.3 used the installed manifest path as its ID. Released
  managed installs put assets under a version-and-digest directory. Both
  host versions default the settings path to
  `<userData>/extension-store/<storeName>/<configName>.json`,
  where `storeName` falls back to the package name. With today's
  `storeName: freelens-readable-logs` and `configName: readable-logs`,
  keeping both in the same profile would open the existing v1 file.
  Fresh v2 settings require a distinct effective path. A new explicit
  `storeName` separates the whole store and its backup directory while
  allowing the existing package identity. A new `configName` alone
  separates the JSON files but leaves the current backup directory shared.
  Changing the package name changes the install and route identity and
  requires an explicit plan for the old Extensions entry. Keeping the
  package name and changing the store name leaves install/update behavior
  to verify. Seed an old settings file in the isolated acceptance profile
  and confirm that the v2 defaults and subsequent saves leave its bytes
  intact. The released uninstall code forgets the install and removes its
  managed build directory. The exact names are for the package-identity
  decision.
  [Current manifest][current-manifest] · [Current config name and schema][current-configuration] · [Current Linux path][current-path] · [1.10.3 settings path][v1-settings] · [2.0.0 settings path][host-settings] · [Store name fallback][host-store-name] · [1.10.3 discovery][v1-discovery] · [Released identity][host-identity] · [Released discovery][host-discovery] · [Route naming][api-routing] · [Released uninstall][host-uninstall] · [Identity decision][identity]

## Clipboard and local input

The current renderer imports Electron clipboard and reports success
synchronously. The guide points to `navigator.clipboard.writeText()`,
which returns a promise. The tagged host delegates clipboard permissions to
the cluster iframe. Use the existing original-text extraction, call from
the explicit copy action and wait for fulfillment before reporting success.
If real Linux clipboard checks reveal a gap, an extension-scoped main RPC
using Electron clipboard is a supported-process alternative.
Verify the two copy controls and native selection copying with Unicode,
whitespace and the timestamp boundary. The prerelease fixture made no
clipboard claim. [Current copy adapter][current-copy] · [Current inspector][current-inspector] · [Porting guide for clipboard][guide-renderer] · [Iframe policy][host-frames] · [Original-content and input contract][baseline] · [Fixture limits][fixture-limits]

Local shortcuts, native selection and IME handling, Escape priority and
Profiles mouse Back use existing DOM events and viewer-local state. Keep
their focus/ownership guards and native history behavior. Native input
ownership uses focus even though polling and Find execution eligibility
must survive a loss of focus. The current key-capture placement and foreign
menu/dialog detection depend on actual host event order and surfaces. Use
native Linux checks for Ctrl+F/G/Shift+G, Enter, Profiles Save, selection,
composition and local dismissal while the native dock, menus and editors
are present. Preserve the v1 behavioral assertions without inheriting
the v1 probe wiring. [Current shortcut logic][current-input] · [Current mouse Back logic][current-back] · [Local input contract][baseline-input]

## Find RPC, worker and teardown

- **Transport and ownership.** The released `Renderer.Ipc.invoke` and
  `Main.Ipc.handle` retain extension-scoped RPC. The main handler receives
  the Electron invoke event, and the released implementation passes it through
  before preparing the reply. Use the real sender and frame identity for
  `find-open`, `find-request` and `find-control`. Ignore the unspecified
  first argument of renderer broadcast listeners. Use RPC where authority
  depends on a sender. The extension owns the token-to-viewer/frame binding,
  protocol validation and request/deadline semantics.
  [Current RPC entry][current-main] · [Main SDK IPC][host-ipc-main] · [Renderer SDK IPC][host-ipc-renderer] · [Channel scoping][host-ipc-scope] · [Broadcast and invoke internals][host-ipc-common] · [Current owner service][current-find-service]
- **Worker and teardown.** Keep Node worker ownership in main. Resolve the
  shipped versioned worker relative to the installed ESM main entry
  (`import.meta.url`), with an explicit worker module format such as
  `.cjs` if using an on-disk CommonJS worker. Preserve the version handshake,
  cancellation, stale reply checks and awaiting actual worker exit before
  replacement or teardown. Distinguish page unmount, whole-document
  navigation and renderer destruction from inactivity, which keeps temporary
  Find state. Tagged `disable()` awaits `onDeactivate()` before running
  SDK disposers. Normal host quit runs a backend shutdown task that awaits
  each extension's `disable()`. This is a source-backed way to retire the
  current Electron `before-quit` hook, contingent on a real normal-quit
  check of the final archive. Ensure cleanup finishes even when a renderer
  has already closed. The prerelease fixture observed round trip, foreign
  frame rejection, cancellation, page/iframe retirement, and disable with
  handler cleanup. It used an extension-owned quit hook. The released-host
  gate still needs worker start/exit parity and empty owner/IPC/listener state.
  [Current Find execution][current-execution] · [Current main quit hook][current-main] · [Current viewer unmount][current-viewer] · [Released deactivate/disposers][host-deactivate] · [Released backend quit][host-quit] · [Released extension shutdown][host-stop-extensions] · [Fixture observations][fixture-observations]

## Package and tests

| Port surface | Released interface and verification consequence |
| --- | --- |
| Compatibility and dependencies | Use `engines.freelens: "^2.0.0"` and pin compilation to SDK 2.0.0. Discovery rebuilds a caret range from major/minor, so 2.0.0 is the acceptance baseline and the declaration admits compatible 2.x hosts. The SDK version is a build dependency. Remove the v1 SDK/core override and React 17/MobX 6 toolchain. Ship a self-contained npm archive with no runtime dependency installation. [Current manifest][current-manifest] · [C1 publication][api-publication] · [C14 gate][api-versioning] · [Gate implementation][host-gate] · [Porting package guide][guide-package] |
| Runtime formats and assets | Replace the combined Node/CommonJS build and `global.LensExtensions`/top-level React/MobX shims with browser ESM renderer and Node main builds. The released host accepts CommonJS main at first load and ESM for development reload, so ESM main fits the desired port. Inline the SDK shim or resolve it at bundle time, use the process-appropriate host singletons (including JSX runtime), and eliminate bare imports that the renderer URL cannot resolve. Emit one stylesheet beside the renderer entry, either matching its stem or `style.css`, in place of injected inline CSS. Preserve the viewer's styling and keep extension rules scoped. [Current build][current-build] · [Current inline CSS][current-inline-css] · [C2 and C3 globals][api-globals] · [C4 module loading][api-modules] · [C10 styles][api-styles] |
| Viewer and compile checks | Keep SDK composition around the Page and adapter seam. The viewer currently imports host Icons, the concrete Pod port and clipboard, so account for those imports on the path into a browser-safe viewer. The published declarations expose both process namespaces even though the runtime exposes only one of them in each process. Apply compile and dependency-graph checks appropriate to renderer, shared code, main and worker. The declaration needs DOM/DOM iterable and ES2024 libs, a package-exports-aware resolution mode and `skipLibCheck: true`. Check linked browser code for Node/Electron reachability and duplicated React/MobX. [Current viewer imports][current-viewer-imports] · [Current history icon][current-history] · [C2 runtime split][api-globals] · [Consumer toolchain floors][api-toolchain] · [Porting runtime contexts][guide-tsconfig] |
| Reproducibility and evaluation | Replace v1 CJS package assertions, loader mocks and CDP globals, including the optional stock-dock comparison's internal store calls. Keep pure behavior tests, browser/worker and resource assertions, exact package contents, repeat-build hash and managed-host evaluation. A packaged worker test with SDK/Electron stand-ins and a headless renderer test cover their respective boundaries. Record the official host asset and reviewed extension archive digests, installation/load outcome and the actual running build from the official Linux release for final acceptance. [Current package check][current-package-check] · [Current mocked transport check][current-packed-check] · [Example current CDP helper][current-cdp] · [Stock comparison helper][current-comparison] · [Current CI checks][current-ci] · [Linux UI playbook][ui-playbook] · [Acceptance question][acceptance] |

The remaining choices are the exact host-independent interfaces and snapshot
cancellation policy, the package and fresh-store names, and the cases that
prove parity on the official Linux build. The release evidence supports
using the existing viewer, formatting and Find behavior as the contract for
those decisions. [Integration boundary][boundary] · [Package identity][identity] · [Acceptance][acceptance]

[ticket]: https://github.com/maksimgurenko/freelens-json-logs/issues/67
[api]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/api.md
[guide]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/migrating-from-v1.md
[release]: https://github.com/freelensapp/freelens/releases/tag/v2.0.0
[appimage-sha]: https://github.com/freelensapp/freelens/releases/download/v2.0.0/Freelens-2.0.0-linux-amd64.AppImage.sha256
[sdk]: https://registry.npmjs.org/@freelensapp%2fextensions/2.0.0
[sdk-tar]: https://registry.npmjs.org/@freelensapp/extensions/-/extensions-2.0.0.tgz
[host-deps]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/pnpm-workspace.yaml#L10-L57
[map]: https://github.com/maksimgurenko/freelens-json-logs/issues/66
[production]: https://github.com/maksimgurenko/freelens-json-logs/commit/11bae594a92faed49116e5b0156e7560f6aa3f46
[baseline]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/docs/specification.md
[fixture]: https://github.com/maksimgurenko/freelens-json-logs/blob/bca4c8a944d8771b06abc6af1e33d7fe5f5246dc/docs/research/freelens2-runtime.md
[acceptance]: https://github.com/maksimgurenko/freelens-json-logs/issues/70
[current-entry]: https://github.com/maksimgurenko/freelens-json-logs/blob/11bae594a92faed49116e5b0156e7560f6aa3f46/src/renderer/index.tsx#L11-L62
[api-registration]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/api.md#c6-registration-and-the-extension-instance
[host-object-details]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/core/src/renderer/components/kube-object-details/kube-object-details.tsx#L55-L60
[host-object-menu]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/core/src/renderer/components/kube-object-menu/kube-object-menu.tsx#L180-L185
[api-routing]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/api.md#c9-routing
[host-route-registrator]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/core/src/renderer/routes/extension-route-registrator.injectable.tsx#L81-L105
[host-navigation]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/core/src/extensions/lens-renderer-extension.ts#L108-L139
[fixture-observations]: https://github.com/maksimgurenko/freelens-json-logs/blob/bca4c8a944d8771b06abc6af1e33d7fe5f5246dc/docs/research/freelens2-runtime.md#observations
[current-pod]: https://github.com/maksimgurenko/freelens-json-logs/blob/11bae594a92faed49116e5b0156e7560f6aa3f46/src/adapter/freelens.ts#L26-L79
[host-pods-export]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/core/src/extensions/renderer-api/k8s-api.ts#L92
[host-pod-model]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/kube-object/src/specifics/pod.ts#L562-L654
[host-kube-get]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/utility-features/kube-api/src/kube-api.ts#L650-L661
[host-log]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/utility-features/kube-api/src/endpoints/pod.api.ts#L91-L101
[baseline-window]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/docs/specification.md#recent-window-and-lifecycle
[current-requests]: https://github.com/maksimgurenko/freelens-json-logs/blob/11bae594a92faed49116e5b0156e7560f6aa3f46/src/core/requests.ts#L13-L31
[host-json]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/utility-features/json-api/src/json-api.ts#L213-L267
[v1-log]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/utility-features/kube-api/src/endpoints/pod.api.ts#L86-L96
[v1-json]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/utility-features/json-api/src/json-api.ts#L239-L265
[current-visibility]: https://github.com/maksimgurenko/freelens-json-logs/blob/11bae594a92faed49116e5b0156e7560f6aa3f46/src/adapter/visibility.ts#L8-L23
[current-window]: https://github.com/maksimgurenko/freelens-json-logs/blob/11bae594a92faed49116e5b0156e7560f6aa3f46/src/adapter/window-visibility.ts#L12-L38
[host-catalog]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/core/src/renderer/cluster-enumeration/cluster-enumeration.injectable.ts#L24-L34
[host-cluster-route]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/core/src/common/front-end-routing/routes/cluster-view/cluster-view-route.injectable.ts#L11-L20
[host-frames]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/core/src/renderer/components/cluster-manager/cluster-frame-handler.ts#L56-L145
[current-settings]: https://github.com/maksimgurenko/freelens-json-logs/blob/11bae594a92faed49116e5b0156e7560f6aa3f46/src/adapter/configuration-store.ts#L1-L55
[current-configuration]: https://github.com/maksimgurenko/freelens-json-logs/blob/11bae594a92faed49116e5b0156e7560f6aa3f46/src/core/configuration.ts#L3-L52
[host-settings]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/core/src/extensions/base-extension-store.ts#L82-L125
[host-storage]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/core/src/features/persistent-storage/common/create.injectable.ts#L99-L194
[host-conf]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/core/src/common/get-configuration-file-model/get-configuration-file-model.injectable.ts#L12-L18
[host-storage-main]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/core/src/features/persistent-storage/main/persist-state-to-config.injectable.ts#L11-L24
[host-storage-renderer]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/core/src/features/persistent-storage/renderer/persist-state-to-config.injectable.ts#L10-L16
[current-reset]: https://github.com/maksimgurenko/freelens-json-logs/blob/11bae594a92faed49116e5b0156e7560f6aa3f46/src/adapter/configuration-file.ts#L8-L49
[baseline-settings]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/docs/specification.md#formatting-and-saved-settings
[current-manifest]: https://github.com/maksimgurenko/freelens-json-logs/blob/11bae594a92faed49116e5b0156e7560f6aa3f46/package.json
[current-path]: https://github.com/maksimgurenko/freelens-json-logs/blob/11bae594a92faed49116e5b0156e7560f6aa3f46/docs/local-development.md#L64-L106
[v1-settings]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/extensions/base-extension-store.ts#L77-L111
[host-store-name]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/core/src/extensions/lens-extension.ts#L56-L82
[v1-discovery]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/extensions/extension-discovery/extension-discovery.ts#L387-L407
[host-identity]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/core/src/extensions/installed-extension.ts#L7-L48
[host-discovery]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/core/src/extensions/extension-discovery/extension-discovery.ts#L754-L774
[host-uninstall]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/core/src/extensions/extension-discovery/extension-discovery.ts#L488-L503
[identity]: https://github.com/maksimgurenko/freelens-json-logs/issues/69
[current-copy]: https://github.com/maksimgurenko/freelens-json-logs/blob/11bae594a92faed49116e5b0156e7560f6aa3f46/src/adapter/clipboard.ts#L1-L8
[current-inspector]: https://github.com/maksimgurenko/freelens-json-logs/blob/11bae594a92faed49116e5b0156e7560f6aa3f46/src/renderer/viewer.tsx#L614-L645
[guide-renderer]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/migrating-from-v1.md#node-and-electron-in-the-renderer
[fixture-limits]: https://github.com/maksimgurenko/freelens-json-logs/blob/bca4c8a944d8771b06abc6af1e33d7fe5f5246dc/docs/research/freelens2-runtime.md#remaining-acceptance
[current-input]: https://github.com/maksimgurenko/freelens-json-logs/blob/11bae594a92faed49116e5b0156e7560f6aa3f46/src/renderer/local-shortcuts.ts#L1-L99
[current-back]: https://github.com/maksimgurenko/freelens-json-logs/blob/11bae594a92faed49116e5b0156e7560f6aa3f46/src/renderer/local-back.ts#L1-L73
[baseline-input]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/docs/specification.md#local-input-and-temporary-history
[current-main]: https://github.com/maksimgurenko/freelens-json-logs/blob/11bae594a92faed49116e5b0156e7560f6aa3f46/src/main.ts#L17-L83
[host-ipc-main]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/core/src/extensions/ipc/ipc-main.ts#L40-L88
[host-ipc-renderer]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/core/src/extensions/ipc/ipc-renderer.ts#L24-L74
[host-ipc-scope]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/core/src/extensions/ipc/ipc-registrar.ts#L15-L30
[host-ipc-common]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/core/src/common/ipc/ipc.ts#L23-L55
[current-find-service]: https://github.com/maksimgurenko/freelens-json-logs/blob/11bae594a92faed49116e5b0156e7560f6aa3f46/src/main/find-service.ts#L19-L124
[current-execution]: https://github.com/maksimgurenko/freelens-json-logs/blob/11bae594a92faed49116e5b0156e7560f6aa3f46/src/main/find-execution.ts
[current-viewer]: https://github.com/maksimgurenko/freelens-json-logs/blob/11bae594a92faed49116e5b0156e7560f6aa3f46/src/renderer/viewer.tsx#L125-L152
[host-deactivate]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/core/src/extensions/lens-extension.ts#L95-L121
[host-quit]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/core/src/main/electron-app/runnables/setup-cleanup-of-backend-on-quit.injectable.ts#L19-L39
[host-stop-extensions]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/core/src/features/extensions/stopping/main/stop-all.injectable.ts#L13-L29
[api-publication]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/api.md#c1-packaging-and-publication
[api-versioning]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/api.md#c14-versioning-and-compatibility
[host-gate]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/packages/core/src/extensions/extension-discovery/is-compatible-extension/is-compatible-extension.ts#L15-L41
[guide-package]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/migrating-from-v1.md#packagejson-for-an-extension
[current-build]: https://github.com/maksimgurenko/freelens-json-logs/blob/11bae594a92faed49116e5b0156e7560f6aa3f46/scripts/build.mjs
[current-inline-css]: https://github.com/maksimgurenko/freelens-json-logs/blob/11bae594a92faed49116e5b0156e7560f6aa3f46/src/renderer/viewer.tsx#L383-L385
[api-globals]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/api.md#c2-the-runtime-global-api
[api-modules]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/api.md#c4-module-format-and-loading
[api-styles]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/api.md#c10-styling-and-css
[current-viewer-imports]: https://github.com/maksimgurenko/freelens-json-logs/blob/11bae594a92faed49116e5b0156e7560f6aa3f46/src/renderer/viewer.tsx#L1-L31
[current-history]: https://github.com/maksimgurenko/freelens-json-logs/blob/11bae594a92faed49116e5b0156e7560f6aa3f46/src/renderer/find-history.tsx#L1-L38
[api-toolchain]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/api.md#c13-consumer-toolchain-floors
[guide-tsconfig]: https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/migrating-from-v1.md#source-layout-one-tsconfig-per-runtime-environment
[current-package-check]: https://github.com/maksimgurenko/freelens-json-logs/blob/11bae594a92faed49116e5b0156e7560f6aa3f46/scripts/check-package.mjs
[current-packed-check]: https://github.com/maksimgurenko/freelens-json-logs/blob/11bae594a92faed49116e5b0156e7560f6aa3f46/scripts/check-find-service.mjs
[current-cdp]: https://github.com/maksimgurenko/freelens-json-logs/blob/11bae594a92faed49116e5b0156e7560f6aa3f46/scripts/find-production-host/install.mjs#L1-L10
[current-comparison]: https://github.com/maksimgurenko/freelens-json-logs/blob/11bae594a92faed49116e5b0156e7560f6aa3f46/scripts/find-production-host/compare-viewers.mjs#L24-L56
[current-ci]: https://github.com/maksimgurenko/freelens-json-logs/blob/11bae594a92faed49116e5b0156e7560f6aa3f46/.github/workflows/ci.yml#L55-L88
[ui-playbook]: https://github.com/maksimgurenko/freelens-json-logs/blob/11bae594a92faed49116e5b0156e7560f6aa3f46/docs/agents/ui-verification.md
[boundary]: https://github.com/maksimgurenko/freelens-json-logs/issues/68
