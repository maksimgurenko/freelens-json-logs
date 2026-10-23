# Freelens extension for readable JSON logs

> Historical research from 2026-10-20, before implementation. Preserved from the
> original README for its API rationale, sources and design proposals. The proposed
> schemas and remaining-validation section describe that earlier investigation,
> rather than the released product. For current behavior, see the [user guide](../usage.md)
> and [development and maintenance reference](../local-development.md).

Checked: **2026-10-20**. This is a feasibility investigation and proposed design; no extension was built or installed.

The target is the locally installed **Freelens 1.10.3** (reported by the parent investigation). API claims below were checked against official tag `v1.10.3`, commit `3da74415bff57a77c6e08cb5f538191ce87bac17`. Its commit date is 2026-07-07 UTC; the release page displays 7 July, 22:44. Moving documentation and newer development are explicitly separated. [Release](https://github.com/freelensapp/freelens/releases/tag/v1.10.3)

## Conclusion

**A custom extension is feasible using supported APIs if it provides its own log view.** A Pod menu action named “Readable logs” can open an extension cluster page with a compact, configurable representation of JSON log records. Application changes or cluster-side collectors are unnecessary for that design.

**Replacing the rendering inside the existing built-in Logs panel has no documented/public formatter registration in 1.10.3.** The supported extension surface registers pages, menus, details, preferences and other specific contributions. Opening built-in log tabs is exposed, but a line-rendering callback is absent. This conclusion is source inspection, not an upstream promise that customization is impossible by every internal technique. Patching internals would add upgrade maintenance; adding an upstream formatter hook would provide the clean integration. [Registration fields](https://github.com/freelensapp/freelens/blob/v1.10.3/packages/core/src/extensions/lens-renderer-extension.ts#L60-L78), [exported log tab functions](https://github.com/freelensapp/freelens/blob/v1.10.3/packages/core/src/extensions/renderer-api/components.ts#L156-L165), [built-in list](https://github.com/freelensapp/freelens/blob/v1.10.3/packages/core/src/renderer/components/dock/logs/list.tsx)

## Verified extension mechanisms

| Need | Available in 1.10.3 | Practical use |
| --- | --- | --- |
| Own cluster page | `clusterPages` | Full readable log viewer in the current cluster |
| Pod context action | `kubeObjectMenuItems` matching `kind: "Pod"`, `apiVersions: ["v1"]` | “Readable logs” opens that page with the selected namespace and Pod |
| Page navigation and parameters | `LensRendererExtension.navigate(pageId, params)` and page registrations | Carry the Pod/container context into the viewer |
| Optional sidebar item | `clusterPageMenus` | Open the viewer without a Pod context menu |
| Global configuration | `appPreferences`, `appPreferenceTabs` | Edit default formatting and profiles |
| Cluster-specific configuration | `entitySettings` | Optional later per-cluster settings UI |

These are declarative extension registrations. There is no need to alter the Kubernetes resource definition to add the menu. [Official class and navigation implementation](https://github.com/freelensapp/freelens/blob/v1.10.3/packages/core/src/extensions/lens-renderer-extension.ts), [menu registration shape](https://github.com/freelensapp/freelens/blob/v1.10.3/packages/core/src/renderer/components/kube-object-menu/kube-object-menu-registration.ts), [page shape](https://github.com/freelensapp/freelens/blob/v1.10.3/packages/core/src/renderer/routes/page-registration.ts), [official reference, undated](https://freelensapp.github.io/docs/extensions/reference/03-renderer-registrations/)

## Reading logs: snapshots first

`Renderer.K8sApi.podsApi` is publicly exported. Its `getLogs({ namespace, name }, query)` requests the Pod `/log` subresource and resolves to a string. Query fields include `container`, `tailLines`, `timestamps`, `sinceTime`, `follow`, and `previous`. This supports a single-Pod/container viewer with a bounded initial tail, manual refresh and optional polling. [Public export](https://github.com/freelensapp/freelens/blob/v1.10.3/packages/core/src/extensions/renderer-api/k8s-api.ts#L92), [Pod API](https://github.com/freelensapp/freelens/blob/v1.10.3/packages/utility-features/kube-api/src/endpoints/pod.api.ts#L86-L96), [query definition](https://github.com/freelensapp/freelens/blob/v1.10.3/packages/kube-object/src/specifics/pod.ts#L33-L42)

The presence of `follow` does **not** make `getLogs` a chunk/event streaming interface: its underlying request awaits `response.text()`. An open `follow=true` response would keep that promise pending until the response ends. The built-in viewer itself uses repeated snapshots and `sinceTime` rather than exposing a public stream callback. [Response parsing](https://github.com/freelensapp/freelens/blob/v1.10.3/packages/utility-features/json-api/src/json-api.ts#L239-L250), [native log store](https://github.com/freelensapp/freelens/blob/v1.10.3/packages/core/src/renderer/components/dock/logs/store.ts#L45-L161)

There is a lower-level public `Renderer.K8sApi.KubeJsonApi.forCluster(clusterId)` whose inherited `getResponse` returns the response before consuming its body. This is a plausible route for future real streaming through the host proxy. It still requires implementation and verification of body consumption, cancellation, errors, partial UTF-8/JSON lines and host-version behavior; it was not exercised against a live cluster here. Avoid reading the protected `podsApi.request` property. [Public constructor/factory](https://github.com/freelensapp/freelens/blob/v1.10.3/packages/core/src/extensions/common-api/k8s-api.ts#L174-L191), [cluster proxy configuration](https://github.com/freelensapp/freelens/blob/v1.10.3/packages/core/src/common/k8s-api/create-kube-json-api-for-cluster.injectable.ts), [getResponse implementation](https://github.com/freelensapp/freelens/blob/v1.10.3/packages/utility-features/json-api/src/json-api.ts#L144-L168)

### Important JSON edge case

The request layer attempts to JSON-decode the **entire response body**. If a snapshot consists of one bare JSON record and `timestamps` is false, it can become an object; `PodApi.getLogs` then returns an empty string because it only accepts string responses. This is an inference directly from the two implementations, not a live-cluster reproduction. Request **`timestamps: true`**, as the native viewer does, and split the Kubernetes timestamp prefix from each payload before parsing JSON. Retain the original line and both timestamps; prefer the application timestamp for display when valid, otherwise use the transport timestamp. [Whole-body parsing](https://github.com/freelensapp/freelens/blob/v1.10.3/packages/utility-features/json-api/src/json-api.ts#L239-L250), [string guard](https://github.com/freelensapp/freelens/blob/v1.10.3/packages/utility-features/kube-api/src/endpoints/pod.api.ts#L86-L96), [native timestamps option](https://github.com/freelensapp/freelens/blob/v1.10.3/packages/core/src/renderer/components/dock/logs/store.ts#L148-L161)

## Persisting configuration

Use `Common.Store.ExtensionStore<Model>` with observable configuration, synchronous `fromStore`/`toJSON`, a stable `configName`, and `loadExtension(this)`. Its default folder is `<userData>/extension-store/<storeName>`. [Public export](https://github.com/freelensapp/freelens/blob/v1.10.3/packages/core/src/extensions/common-api/stores.ts), [store implementation](https://github.com/freelensapp/freelens/blob/v1.10.3/packages/core/src/extensions/base-extension-store.ts#L77-L115), [official persistence reference, undated](https://freelensapp.github.io/docs/extensions/reference/07-persistence-and-ipc/)

**Use a renderer UI plus a tiny main-process entry that loads the same configuration store.** A strictly renderer-only extension is insufficient for the normal store persistence path in this version: renderer file persistence is a no-op, while the main implementation writes the file; changes synchronize through process message channels. No custom IPC protocol is needed for settings. [Renderer persistence](https://github.com/freelensapp/freelens/blob/v1.10.3/packages/core/src/features/persistent-storage/renderer/persist-state-to-config.injectable.ts), [main persistence](https://github.com/freelensapp/freelens/blob/v1.10.3/packages/core/src/features/persistent-storage/main/persist-state-to-config.injectable.ts), [reaction and channels](https://github.com/freelensapp/freelens/blob/v1.10.3/packages/core/src/features/persistent-storage/common/create.injectable.ts)

## Proposed default and user configuration

This section is a product recommendation, not functionality already provided by Freelens.

Default display: **time · level · message**, with extra fields shown as compact key/value values or an explicit “+N fields” expander. Selecting a row reveals the complete parsed record. Provide a raw toggle and raw-copy action. Preserve plain text, invalid JSON and stack-trace lines; parsing must never make a line disappear.

```text
Input:
{"time":"2026-10-20T10:42:11Z","level":"error","msg":"Payment declined","orderId":841,"error":{"code":"CARD_EXPIRED"}}

Compact row:
10:42:11  ERROR  Payment declined  orderId=841  +1 field

Expanded fields:
error.code  CARD_EXPIRED
```

Auto-detect common alternatives such as `message`/`msg`, `timestamp`/`time`/`@timestamp`, and `level`/`severity`/`log.level`. Let users override those mappings with nested field paths. Numeric severity requires a named logging-dialect preset or an explicit value map; there is no universal numeric level interpretation.

Keep configuration as data: field paths, field order, visible/hidden fields, timestamp presentation, level aliases/value maps, and optional compact templates. Do not evaluate user JavaScript. Deterministic JSON parsing and formatting need no LLM or external service.

Start with a global default profile and optional named application profiles. A profile can match namespace, Pod labels and container, avoiding reliance on changing Pod names. Use explicit precedence: a manually selected profile wins; otherwise the first matching enabled profile in user-controlled order wins; otherwise use the global default. Show the active profile and allow editing against a sample log with a live preview.

An illustrative profile could look like this. This is a proposed configuration schema, not an existing Freelens setting. The UI should let users choose these fields without writing JSON; import/export can expose the same model.

```json
{
  "name": "payments",
  "match": {
    "namespace": "production",
    "labels": { "app.kubernetes.io/name": "payments" }
  },
  "fields": {
    "time": ["/timestamp", "/time"],
    "level": ["/severity", "/level"],
    "message": ["/message", "/msg"]
  },
  "inlineFields": ["/orderId", "/error/code"],
  "hideFields": ["/pid", "/hostname"]
}
```

Here each field-mapping array specifies fallback order; `/error/code` selects the nested error code. The profile would render `orderId` and the error code inline, while omitting `pid` and `hostname` from the compact row. All original fields remain available in the expanded/raw record. The global default continues to handle applications without a matching profile.

The first release should handle one Pod and one container, bounded recent logs, refresh/pause, raw access, common field aliases and saved profiles. Defer multi-Pod merging and true streaming. If polling becomes incremental, avoid adding a whole second to `sinceTime`; keep a timestamp cursor and carefully handle the overlapping boundary while preserving repeated identical records.

## Existing comparable extensions

**Workload Topology already formats JSON logs in its own view.** The author's repository declares Freelens `^1.6.0`, registers a cluster page, and includes a Pod log modal. Its parser extracts message/severity/logger/trace fields using hardcoded alternatives; the inspected parser has no user-provided mapping/profile input. This is useful prior art, but it is a larger topology product rather than a focused configurable log formatter. [Author README](https://github.com/agent-jeong/freelens-workload-topology), [manifest at inspected commit](https://github.com/agent-jeong/freelens-workload-topology/blob/311a3da84778d617059268327a40f3e59857ade7/package.json), [parser](https://github.com/agent-jeong/freelens-workload-topology/blob/311a3da84778d617059268327a40f3e59857ade7/src/renderer/components/PodLogsModal/logParser.ts#L165-L191)

Its log loader fetches snapshots and polls every three seconds. The proxy helper reaches through `podsApi` using `as any` and an internal property, explicitly acknowledging missing stable types. Reuse the idea of an independent viewer, while favoring the public `getLogs` API for the MVP. Inspected commit: `311a3da84778d617059268327a40f3e59857ade7`, dated **2026-08-23 UTC** / 2026-08-24 in its commit timezone. [Loader](https://github.com/agent-jeong/freelens-workload-topology/blob/311a3da84778d617059268327a40f3e59857ade7/src/renderer/components/PodLogsModal/index.tsx#L292-L330), [polling](https://github.com/agent-jeong/freelens-workload-topology/blob/311a3da84778d617059268327a40f3e59857ade7/src/renderer/components/PodLogsModal/index.tsx#L550-L557), [proxy helper](https://github.com/agent-jeong/freelens-workload-topology/blob/311a3da84778d617059268327a40f3e59857ade7/src/renderer/utils/kube.ts#L166-L174)

**Multi Pod Logs** adds workload actions and opens a terminal for aggregate Pod/container logs. Its README does not establish a configurable structured-record UI. [Author README, undated](https://github.com/andrea-falco/freelens-multi-pod-logs)

## Newer development and compatibility

The official example extension's moving `main` README currently requires **Freelens >=2.0.0**. Do not clone it blindly for the installed 1.10.3. A **1.10.x tagged example** is the appropriate starting reference; the releases page lists v1.10.2, displayed as released 1 July, 12:40. Version 1.x output uses CommonJS and host-provided React/MobX rather than bundled duplicate instances. [Current example README, undated](https://github.com/freelensapp/freelens-example-extension), [1.10.2 example](https://github.com/freelensapp/freelens-example-extension/tree/v1.10.2), [release list](https://github.com/freelensapp/freelens-example-extension/releases), [1.x packaging reference, undated](https://freelensapp.github.io/docs/extensions/reference/01-getting-started/)

The maintainers explicitly state that the v2 extension API breaks v1 compatibility. Issue #2304, opened **2026-07-23**, describes the new contracts and migration work. Keep parsing/profile logic independent from the small host adapter so a later port does not require rewriting the core formatter. [Maintainer specification issue](https://github.com/freelensapp/freelens/issues/2304)

Native logging improvements are active, but do not establish a JSON-formatting hook: open PR #2418, opened **2026-08-15**, adds combined workload logs and discusses a separate renderer rewrite. No concrete native configurable-JSON formatter plan was found in this scoped search. That is a search limitation, not proof that no related proposal exists. [Combined logs PR](https://github.com/freelensapp/freelens/pull/2418)

## Remaining validation before implementation

The public API shape and source behavior are verified. The proposed extension has not been typechecked, loaded in Freelens, or tested against Kubernetes here. A small implementation spike should verify Pod-action navigation, settings persistence across restart, timestamp-prefixed JSON snapshots, denied log access, empty logs, container changes and a bounded large tail. True streaming, multi-Pod ordering and automatic profile migration remain separate follow-up work.
