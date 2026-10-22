# Freelens 1.10.3 integration-spike contract

Research checked **2026-10-21** for [Establish the Freelens 1.10.3 contract for the integration spike](https://github.com/maksimgurenko/freelens-json-logs/issues/2), under [Map: Readable JSON logs first-release specification](https://github.com/maksimgurenko/freelens-json-logs/issues/1).

This is source research for a later disposable spike. No dependencies were installed, extension built or installed, Freelens launched, or Kubernetes requests made. It does not approve the README’s detailed product proposals. The existing separate-view, one-Pod/one-container boundary is the investigation’s input.

## Answer and evidence boundary

The three required proofs have a public 1.10.3 path: a renderer Pod menu registration navigates to an extension cluster page; that page calls `Renderer.K8sApi.podsApi.getLogs` for timestamp-prefixed snapshots; matching main and renderer `Common.Store.ExtensionStore` instances synchronize a saved marker and persist it through the main process. The tagged example supplies a compatible CommonJS build pattern. These are source contracts, **not proof that a new package has loaded or that a real cluster returns the expected data**. [Renderer registrations and navigation][renderer-extension], [Pod log method][pod-api], [store lifecycle][extension-store], [example build][example-build]

Evidence labels below:

- **Source fact:** directly read in the pinned official source or registry metadata.
- **Inference:** a consequence of those implementations that was not reproduced in the host.
- **Spike recommendation:** the smallest experiment suggested by the evidence; not an adopted production behavior.
- **Unverified:** must be observed in the installed host or cluster later.

### Revisions and dates

| Source | Exact revision | Source date |
| --- | --- | --- |
| Official Freelens `v1.10.3` | `3da74415bff57a77c6e08cb5f538191ce87bac17` | Commit **2026-07-07 22:27:04 UTC**; release published **2026-07-07** |
| Official example extension `v1.10.2` | `4ca939d2ce979ca783655c1c794112a83f9c431e` | Commit **2026-07-01 12:39:39 UTC** |
| Published `@freelensapp/extensions@1.10.3` | Version-specific npm metadata | Published **2026-07-07 22:50:29.701 UTC** |

The commit dates come from [Freelens commit metadata][host-commit] and [example commit metadata][example-commit]; the release is [Freelens v1.10.3][release]. The npm package’s version, entry and type files, and `@freelensapp/core: ^1.10.3` dependency were rechecked against [version-specific registry metadata][sdk-registry]; the publication time is in the [registry version history][sdk-history]. The source tag also declares SDK version 1.10.3. [SDK manifest][sdk-manifest]

The README investigation dated 2026-10-20 was the starting point. The contracts below were rechecked at these revisions. The [moving getting-started documentation, undated][moving-docs] was consulted as orientation, but source and the tagged example control where they differ. Links below use immutable commits; moving documentation is not compatibility evidence.

## 1. Pod action, navigation and context

**Source facts.** `Renderer.LensExtension` exposes `kubeObjectMenuItems` and `clusterPages`. The menu registration is `{ kind: "Pod", apiVersions: ["v1"], components: { MenuItem } }`. A menu component receives `object` and optional `toolbar`; the menu renderer passes those two values. It receives **no selected-container prop**. A component can use the exported `Renderer.Component.MenuItem` and `Icon`, following the example’s closure that supplies its extension instance. [Registration and props][menu-registration], [menu invocation][menu-renderer], [public components][components], [example registrations][example-renderer], [example menu][example-menu]

**Source facts.** A cluster-page registration has a unique `id`, optional `params`, and `components.Page`. A parameter declaration is either a string default or an object with `defaultValue`, `parse`, and `stringify`. The host supplies the page with `{ params }` containing `PageParam` objects; read values with `.get()`, not `props.params.namespace` as a string. A wrapper must forward those props. `Renderer.Navigation` exports `PageParam`/`PageParamInit` types. [Page registration][page-registration], [normalization][page-params], [page mounting][page-mount], [parameter operations][page-param], [public navigation exports][navigation]

**Source facts.** `extension.navigate(pageId, params)` looks up the registration and route, serializes each supplied key through its registered `PageParam`, then navigates with a query. Missing page/route returns without navigation; an undeclared parameter key has no normalization entry. Therefore every key passed by the action must be declared. The upstream tests exercise parameter serialization and page reads, although their fixture uses global pages rather than proving this Pod-to-cluster-page journey live. [Navigation implementation][renderer-extension], [upstream navigation tests][navigation-tests]

**Spike recommendation.** Use one page ID, such as `readable-logs-spike`, and declare string parameters `namespace`, `pod`, `podUid`, and `container` with empty defaults. Pass only these scalars from the action. Do not serialize the Pod object into the URL. Render the received identity visibly so the observation proves parameter transfer. A UID comparison after reloading Pod metadata can detect replacement by another Pod with the same name; this is an experiment safeguard, not a product decision. The host exposes `Pod`, `getName()`, `getNs()`, and `getId()`; `getId()` uses UID with self-link fallback. [Public Pod export][public-pod], [identity methods][pod-identity]

**Source facts.** `Renderer.Catalog.activeCluster` is a computed value whose `.get()` returns the active Kubernetes catalog entity or `null`. `Renderer.Catalog.getActiveCluster()` returns a `ClusterInfo` or `undefined`, including `id`, `name`, `contextName`, and status. The convenience Pod API is cluster-frame scoped: creating it requires the hosted-cluster environment, and its request uses that frame’s proxy Host header. Reading cluster information does not retarget `podsApi` to an arbitrary cluster. [Catalog API][catalog], [computed active entity][active-cluster], [ClusterInfo][cluster-info], [Pod API injection][pod-injection], [environment gate][cluster-api-gate], [frame request][frame-api]

**Spike recommendation.** Read logs from the cluster page, not from a global preference view or main activation. Record active cluster ID/name beside the target and test cluster switching. Recheck `podsApi.get({ namespace, name })` if current Pod labels/container membership/UID are needed after navigation: this public method returns a Pod or `null` and can fail, so stale URL context is not authoritative. [Public Pod API][renderer-k8s], [resource lookup][kube-api]

**Source facts and limitation.** `Pod` exposes regular, init and ephemeral container lists, and combined lists. Built-in Logs reconstructs `new Pod(object)`, creates its own container menu, and uses the `kubectl.kubernetes.io/default-container` annotation with first-container fallback. Its helper is an internal implementation reference, not an exported contract to import. The extension does not inherit a container already selected in the built-in Logs dock. [Pod container methods][pod-containers], [built-in Logs action][native-menu], [built-in menu choice][native-container-menu], [default helper][native-default]

**Spike recommendation.** For the proof, choose an existing regular container explicitly in the disposable page, then repeat with a second container when available. This avoids silently adopting first-container, annotation, init-container or ephemeral-container product rules. Those rules remain for the existing human decisions.

## 2. Snapshot request and timestamp contract

**Source fact.** The public call is:

```ts
Renderer.K8sApi.podsApi.getLogs(
  { namespace: string, name: string },
  {
    container?: string,
    tailLines?: number,
    timestamps?: boolean,
    sinceTime?: string, // ISO string in the SDK comment
    follow?: boolean,
    previous?: boolean,
  },
): Promise<string>
```

`ResourceDescriptor.namespace` is optional in the actual type and defaults to `default` in the resource API; the spike must supply it explicitly. `getLogs` formats the Pod resource URL, appends `/log`, awaits its request, and accepts only a string result. The SDK’s `PodLogsQuery` does **not** declare `limitBytes` or `sinceSeconds`; a bounded line count is not a byte limit. [Public instance export][renderer-k8s], [method implementation][pod-api], [query declaration][pod-query], [resource descriptor and URL behavior][kube-api]

**Source fact.** The request layer awaits `response.text()` and attempts to JSON-parse the entire body before returning data. `follow` is only a query flag here; `getLogs` has no chunks, events or stream reader. [Whole-response handling][json-api]

**Inference, rechecked.** A snapshot containing a single bare JSON object, array, number, boolean or null, with `timestamps` disabled, can be decoded into a non-string and then silently become `""` in `getLogs`. A JSON string literal can return its decoded string rather than the original quoted raw body. This follows from whole-response decoding plus the string guard; it was not reproduced against Kubernetes. [Response decoding][json-api], [string guard][pod-api]

**Spike recommendation.** Request one finite snapshot with an explicit container, finite `tailLines` (for example 100 for the proof), `timestamps: true`, `follow: false`, and `previous: false`. Do not use `sinceTime` or append results in the first proof: replace the prior bounded snapshot. The built-in viewer also requests timestamps, then splits the transport prefix from the payload. The API does not itself parse an application JSON record. [Native request and splitting][native-store], [Pod API][pod-api]

**Spike recommendation.** Show a raw response and the separated transport timestamp/payload for a known JSON line. Preserve the response and payload without the native viewer’s `trimEnd()`/carriage-return replacement; those transformations are a reference implementation choice, not a requirement for raw access. Keep timestamp text, including fractional precision, rather than using a JavaScript `Date` conversion as the sole retained value. Validate before splitting so an unexpected prefix remains visible raw. Exact timestamp grammar and multiline behavior in the target cluster remain observations. [Native transformations and split functions][native-store]

**Source fact and constraint.** The native refresh store uses `sinceTime` and adds one second to its last timestamp. Copying this is not required by the public API. **Inference:** adopting that cursor can skip records emitted within the omitted second, so it is unsuitable evidence for a lossless incremental algorithm. Incremental retrieval and duplicate handling need their own decision/test if later chosen; they are unnecessary for the finite-snapshot proof. [Native cursor][native-store]

## 3. Errors, polling and cleanup

**Source facts.** `getLogs` takes only `(ResourceDescriptor, PodLogsQuery?)`; it has no `AbortSignal`, request-init parameter or returned cancel handle. The underlying generic JSON API supports request-init, but the convenience method does not forward one. A Pod watch’s abort controller belongs to a different method and does not cancel this log request. There is no timeout declared in `getLogs`. The extension base class has `onActivate` and `onDeactivate`; disable calls the latter. No inspected log method ties a request to page unmount or extension deactivation. [Log signature][pod-api], [generic request-init and response consumption][json-api], [watch implementation][kube-api], [extension lifecycle][extension-lifecycle]

**Source facts.** Successful non-string responses become empty strings in `getLogs`; HTTP failures do not. The JSON API throws a raw parsed body for a GET 403; other non-2xx responses use `JsonApiErrorParsed`, while fetch rejection can pass through. Callers therefore cannot assume every error has `.message` or is an `Error`. [String guard][pod-api], [HTTP/error branches][json-api]

**Spike recommendation.** Keep at most one request active for a target; schedule another only after settlement. A page-owned timer must stop on pause/unmount and extension deactivation. Capture a generation plus cluster/Pod/container identity; after an awaited result, apply it only if the page is still active and the generation/identity still matches. Stop or report a denied/failed fetch visibly for the experiment. This is application-side stale-result suppression, **not transport cancellation**. Exercise pause and context changes while a request is outstanding if the environment makes that observable. These recommendations follow from the absence of cancellation in the convenience method; no refresh interval, timeout, retry policy or final pause semantics are approved here. [API limitation][pod-api], [deactivation hook][extension-lifecycle]

**Unverified.** A pending request may still consume resources after pause/navigation. A hanging request is not made finite merely by using `tailLines` and `follow: false`. If hard cancellation or a client deadline becomes a first-release requirement, public `Renderer.K8sApi.KubeJsonApi.forCluster(clusterId)` and inherited request-init provide a separate candidate to investigate; it is not part of this minimal `getLogs` proof. Do not reach through protected `podsApi.request`. No streaming is proposed. [Public lower-level factory][public-json-factory], [proxy configuration][cluster-json-factory], [generic API][json-api], [protected request][kube-api]

## 4. Main/renderer entries and shared saved state

**Source facts.** The manifest’s `main` and `renderer` fields are optional paths to the respective bundles. The loader uses the applicable path and reads `require(path).default`. The tagged example supplies default-export subclasses of `Main.LensExtension` and `Renderer.LensExtension`, each loading the same shared store from `onActivate`. Its renderer registers the UI independently from its store loading. [Manifest type][manifest], [module loading][extension-loader], [example main][example-main], [example renderer][example-renderer]

**Source facts.** `Common.Store.ExtensionStore<Model>` is publicly exported. The example uses observable fields plus `makeObservable`, a stable `configName`, defaults, synchronous `fromStore`, JSON-serializable `toJSON`, and the class singleton `getInstanceOrCreate()`. `loadExtension(this)` returns synchronously: it creates storage, loads disk state, and starts reactions/listeners. The example main’s `await` does not turn it into a disk-flush or cross-process acknowledgement. [Store export][store-export], [example store][example-store], [store lifecycle][extension-store], [storage reaction][persistent-storage]

**Source facts.** The default directory is `<userData>/extension-store/<extension.storeName>`, with `storeName` falling back to the manifest name. The same `configName`, `storeName`, defaults and model must be used in both entry points so they refer to the same configuration path and synchronization channel. Do not hardcode the installed system’s user-data directory from this research. [Store path][extension-store], [storeName fallback][extension-lifecycle], [configuration path and channels][persistent-storage]

**Source facts.** Renderer persistence is a no-op. Main persistence writes model keys with `config.set`; reactions also send the model over path-specific channels, and receiving processes update via `fromStore`. Renderer sends to `store-sync-main`; main sends to `store-sync-renderer`. This establishes the normal main-process writer requirement. A renderer-only loaded store does not prove settings persistence. The inspected API exposes no public stop-sync method or transaction/flush acknowledgement. [Renderer writer][renderer-persist], [main writer][main-persist], [reaction/listener][persistent-storage], [main channel direction][main-channels], [renderer channel direction][renderer-channels], [public store class][extension-store]

**Spike recommendation.** Use one harmless observable string marker, shown and editable on the disposable page, with identical store code in both entries. Load from activation, not page renders; make `toJSON()` read observable state and keep `fromStore(toJSON())` stable. Display or log activation and marker observations without logging real application logs or credentials. Change the marker in the renderer, observe it in main or the configuration file, then quit and reopen the whole host to verify it survives. A reload alone does not prove full-process persistence. A single marker tests transport/storage, not profile schema, validation, migrations, concurrent-write conflict resolution, or lossless crash recovery. [Example lifecycle][example-main], [example store][example-store], [synchronous storage contract][persistent-storage]

## 5. Build and package constraints

**Source facts.** The tagged example manifest ships `out/**/*`, points `main` to `out/main/index.js` and `renderer` to `out/renderer/index.js`, declares Node `>=22.0.0`, and uses `engines.freelens: ^1.8.0`. Its build uses electron-vite’s `main` and **`preload` configuration for the renderer entry**, CommonJS output with a named `default` export, and host-global shims. Runtime Electron/Node built-ins remain external. The renderer is a host-mounted page, not a separately mounted React application. [Example manifest/scripts][example-package], [build configuration][example-build], [global shim implementation][example-globals], [host page mounting][page-mount]

| Import | Source-backed host mapping for this spike |
| --- | --- |
| `@freelensapp/extensions` | `global.LensExtensions`; main has `Main, Common`, renderer has `Renderer, Common` |
| `mobx` | `global.Mobx` in both processes |
| `react`, `react/jsx-runtime` | `global.React`, `global.ReactJsxRuntime` in renderer |
| `mobx-react`, `react-router-dom` | `global.MobxReact`, `global.ReactRouterDom` in renderer |
| `react-dom` | Host source exports **`ReactDOM`**, while the example maps **`global.ReactDom`**; avoid importing it for the minimal page and verify the actual runtime global before use |

These names are backed by the [host main exports][host-main-exports], [host renderer exports][host-renderer-exports], [global library output][host-renderer-build], and [example mappings][example-build]. **Source discrepancy, not a reproduced failure:** the `ReactDOM`/`ReactDom` capitalization differs between the official artifacts. The required three proofs need no direct `react-dom` call because Freelens mounts the page.

**Spike recommendation.** Externalize host React/MobX/API imports through the example’s global shims; keep them in development dependencies and avoid duplicate runtime instances. Use published `@freelensapp/extensions` **exactly 1.10.3** for type checking, while using example `v1.10.2` as a build-layout reference. Generate and retain a lockfile for the disposable package. The example pins React 17.0.2, MobX 6.13.7, MobX React 7.6.0 and TypeScript 5.9.3; `.nvmrc` specifies Node 24.15.0 and `packageManager` specifies pnpm 10.34.4. These are a reproducible reference toolchain, not additional host runtime requirements. [Example manifest][example-package], [Node reference][example-node], [published SDK][sdk-registry]

**Source fact.** The host compatibility gate takes the first major/minor from `engines.freelens` and checks a synthesized caret range. Thus even `1.10.3` is not an exact patch-version lock, and `^1.10.0` can admit later 1.x hosts. Record and manually verify host **1.10.3** in the spike; the manifest cannot prove that exact test target. No broad version-support claim follows. [Compatibility implementation][compatibility], [host API version][api-version]

## 6. Smallest later build/install/restart experiment

This is a proposed procedure for [Validate the Freelens host integration with a disposable spike](https://github.com/maksimgurenko/freelens-json-logs/issues/7). None of it was executed here.

1. On its own disposable branch/package, take the tagged example’s build setup, then remove CRD registrations and test resources. Keep only two default-export entry points, one shared marker store, a Pod action and a cluster page with target identity, explicit regular-container selection, raw timestamp-prefixed snapshot output, and marker editing. Use a unique package name, version and `storeName` so cleanup can identify the experiment. No collector, CRD, app change or host-internal import is needed for these contracts. [Example entries][example-main], [example renderer][example-renderer], [build][example-build], [store][example-store]
2. Prepare the manifest/lockfile with SDK 1.10.3 and the host-global build mappings; run the chosen toolchain’s dependency install, `pnpm type:check`, `pnpm build`, and `pnpm pack`. Inspect the tarball for the two manifest entry paths, shared compiled modules and absence of bundled host libraries. The example documents `pnpm i`, `pnpm build`, `pnpm pack`; its `prebuild` runs type checking. Its `pack:dev` additionally bumps the version, so a manual build/pack sequence is simpler for a fixed disposable version. **These commands have not been run or demonstrated to pass.** [Tagged build instructions][example-readme], [scripts and shipped files][example-package]
3. In the already installed Freelens 1.10.3, open Extensions and provide the local `.tgz` path, or drag the tarball into the window, as the tagged example instructs. Observe successful enable/activation of both entry points and any logs. Use this supported UI path; a symlinked development folder is not required. The host’s local discovery path is `~/.freelens/extensions`; this is distinct from the settings user-data path. [Tagged installation instructions][example-readme], [discovery source][extension-discovery], [main/renderer loading][extension-loader]
4. Open an authorized existing Pod’s action, select an existing regular container, and record the evidence below. Change the marker. Wait until the main writer/file observation demonstrates the change, then quit and reopen the full application normally. Reopen the same page and verify the marker without re-entering it. No host-specific reload mechanism or safe flush delay is established by this research. [Main writer][main-persist], [sync behavior][persistent-storage]
5. Disable/uninstall the unique disposable extension through the host UI after evidence is recorded. Confirm its action/page disappears. Treat removal of any leftover experimental store data as separate, targeted cleanup after recording its actual path; extension removal is not evidence that saved state is erased. The host’s disable hook exists, but no cleanup result is claimed here. [Disable lifecycle][extension-lifecycle], [store location][extension-store]

### Required observations and additional checks

| Check | Evidence to record | Status |
| --- | --- | --- |
| Build and load | Host version, SDK/lock revision, tarball version; typecheck/build outcome; both activations and no duplicate-React/render errors | Unverified |
| Pod-to-page navigation | Action visible; cluster, namespace, Pod name/UID agree; declared params arrive and remain correct on a second Pod | Unverified |
| Container identity | One explicit container’s logs; switch to another when available; old result never overwrites new target | Unverified |
| Timestamp-prefixed JSON | A known JSON line’s original raw response, separated transport timestamp and unchanged payload; readable representation does not replace raw evidence | Unverified |
| Whole-body edge case | If an approved test source provides exactly one JSON record, compare `timestamps: false` versus `true`; optional reproduction must not weaken the timestamped required proof | Source inference only |
| Saved marker | Renderer edit reaches main/file and remains after a complete quit/reopen; record actual config path without private contents | Unverified |
| Empty/denied/unavailable logs | Distinguish empty text from failure; observe 403 body/error shape and a deleted/unavailable target where safe and already available | Unverified |
| Pause/navigation/deactivation | Timer stops; outstanding result is ignored according to the experiment’s generation guard; disable removes contribution | Unverified |
| Bound and large line | Finite tail requested; stored/rendered results remain bounded; note response size and long-line behavior without claiming a server byte limit | Unverified |
| Cluster switch | Frame API and displayed identity remain aligned; stale results do not appear under the next cluster | Unverified |

A successful spike must demonstrate **navigation, timestamp-prefixed snapshot reading, and persistence after full restart**. If the target environment cannot supply a secondary/error/large-tail case, record it as untested rather than fabricate a pass. The research alone leaves all runtime rows unverified. It also leaves product choices—refresh timing, pause semantics, default container rules, error/retry/deadline policy, profile format and rendering behavior—to their decision tickets.

<!-- Immutable source links. -->
[renderer-extension]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/extensions/lens-renderer-extension.ts
[menu-registration]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/renderer/components/kube-object-menu/kube-object-menu-registration.ts
[menu-renderer]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/renderer/components/kube-object-menu/kube-object-menu.tsx
[components]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/extensions/renderer-api/components.ts
[page-registration]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/renderer/routes/page-registration.ts
[page-params]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/renderer/routes/extension-page-parameters.injectable.ts
[page-mount]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/renderer/routes/extension-route-registrator.injectable.tsx
[page-param]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/renderer/navigation/page-param.ts
[navigation]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/extensions/renderer-api/navigation.ts
[navigation-tests]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/features/navigate-to-extension-page.test.tsx
[catalog]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/extensions/renderer-api/catalog.ts
[active-cluster]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/renderer/cluster-frame-context/active-kubernetes-cluster.injectable.ts
[cluster-info]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/extensions/common-api/cluster-types.ts
[pod-injection]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/utility-features/kube-api-specifics/src/specifics/pod.api.injectable.ts
[cluster-api-gate]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/renderer/stores-apis-can-be-created.injectable.ts
[frame-api]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/renderer/k8s/api-kube.injectable.ts
[renderer-k8s]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/extensions/renderer-api/k8s-api.ts
[public-pod]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/extensions/common-api/k8s-api.ts
[pod-identity]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/kube-object/src/kube-object.ts
[pod-containers]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/kube-object/src/specifics/pod.ts
[native-menu]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/renderer/components/node-pod-menu/pod-logs-menu.tsx
[native-container-menu]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/renderer/components/node-pod-menu/pod-menu-item.tsx
[native-default]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/renderer/components/dock/logs/default-container-helper.ts
[pod-api]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/utility-features/kube-api/src/endpoints/pod.api.ts
[pod-query]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/kube-object/src/specifics/pod.ts#L33-L42
[kube-api]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/utility-features/kube-api/src/kube-api.ts
[json-api]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/utility-features/json-api/src/json-api.ts
[native-store]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/renderer/components/dock/logs/store.ts
[extension-lifecycle]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/extensions/lens-extension.ts
[public-json-factory]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/extensions/common-api/k8s-api.ts#L174-L191
[cluster-json-factory]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/common/k8s-api/create-kube-json-api-for-cluster.injectable.ts
[manifest]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/technical-features/application/legacy-extensions/src/lens-extension.ts
[extension-loader]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/extensions/extension-loader/extension-loader.ts
[store-export]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/extensions/common-api/stores.ts
[extension-store]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/extensions/base-extension-store.ts
[persistent-storage]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/features/persistent-storage/common/create.injectable.ts
[renderer-persist]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/features/persistent-storage/renderer/persist-state-to-config.injectable.ts
[main-persist]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/features/persistent-storage/main/persist-state-to-config.injectable.ts
[main-channels]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/features/persistent-storage/main/ipc-channel-prefix.injectable.ts
[renderer-channels]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/features/persistent-storage/renderer/ipc-channel-prefix.injectable.ts
[host-main-exports]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/freelens/src/main/index.ts
[host-renderer-exports]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/freelens/src/renderer/index.ts
[host-renderer-build]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/freelens/webpack/renderer.ts
[compatibility]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/extensions/extension-discovery/is-compatible-extension/is-compatible-extension.ts
[api-version]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/common/vars/extension-api-version.injectable.ts
[extension-discovery]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/extensions/extension-discovery/extension-discovery.ts
[sdk-manifest]: https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/extensions/package.json
[example-package]: https://github.com/freelensapp/freelens-example-extension/blob/4ca939d2ce979ca783655c1c794112a83f9c431e/package.json
[example-build]: https://github.com/freelensapp/freelens-example-extension/blob/4ca939d2ce979ca783655c1c794112a83f9c431e/electron.vite.config.js
[example-globals]: https://github.com/freelensapp/freelens-example-extension/blob/4ca939d2ce979ca783655c1c794112a83f9c431e/build/global-externals.js
[example-main]: https://github.com/freelensapp/freelens-example-extension/blob/4ca939d2ce979ca783655c1c794112a83f9c431e/src/main/index.ts
[example-renderer]: https://github.com/freelensapp/freelens-example-extension/blob/4ca939d2ce979ca783655c1c794112a83f9c431e/src/renderer/index.tsx
[example-menu]: https://github.com/freelensapp/freelens-example-extension/blob/4ca939d2ce979ca783655c1c794112a83f9c431e/src/renderer/menus/example-active-toggle-menu-item-v1alpha1.tsx
[example-store]: https://github.com/freelensapp/freelens-example-extension/blob/4ca939d2ce979ca783655c1c794112a83f9c431e/src/common/store/preferences-store.ts
[example-node]: https://github.com/freelensapp/freelens-example-extension/blob/4ca939d2ce979ca783655c1c794112a83f9c431e/.nvmrc
[example-readme]: https://github.com/freelensapp/freelens-example-extension/blob/4ca939d2ce979ca783655c1c794112a83f9c431e/README.md
[host-commit]: https://api.github.com/repos/freelensapp/freelens/commits/3da74415bff57a77c6e08cb5f538191ce87bac17
[example-commit]: https://api.github.com/repos/freelensapp/freelens-example-extension/commits/4ca939d2ce979ca783655c1c794112a83f9c431e
[release]: https://github.com/freelensapp/freelens/releases/tag/v1.10.3
[sdk-registry]: https://registry.npmjs.org/@freelensapp/extensions/1.10.3
[sdk-history]: https://registry.npmjs.org/@freelensapp/extensions
[moving-docs]: https://freelensapp.github.io/docs/extensions/reference/01-getting-started/
