# Installing Readable logs in current commercial Lens

**Checked:** 2026-10-22. **Local extension:** `freelens-readable-logs` 0.1.20. **Target:** Mirantis Lens K8S IDE, with the extension system released in stable **2026.10.51501** on **2026-10-06**. This is documentation and source research; no Lens installation or execution was performed. [Official release announcement, 2026-10-06](https://forums.k8slens.dev/t/2026-10-51501-latest-extensions-are-back-release/7228)

## Verdict

**Do not offer our existing Freelens tarball as a current Lens extension. A separate Lens host adapter and package are required.** Lens now supports extensions again, but its documented contract differs from our package in entry point, registration, dependency resolution and access to the filesystem. The mismatch is established from the sources below; an actual installation failure or successful port has not been observed.

**A supported port is plausible.** Lens documents custom tabs in the main view **and dock**, Kubernetes object actions, Kubernetes resource access and durable settings. That makes it worth testing the desired placement beside native Logs. This establishes a supported capability category, not the exact dock registration, lifecycle or raw Pod-log API our viewer needs. The complete reference is generated for the installed build at `~/.k8slens/extensions/extension-development-instructions/README.md`. [Lens Extensions, displayed date 2026-10-06](https://docs.lenshq.io/k8slens/extensions/)

## Installation, subscription and distribution

- **Entitlement:** Personal does not include extensions; Plus, Pro and Enterprise do. The marketplace also documents installation during an active trial. Browsing does not require a premium plan. [Pricing, undated; checked 2026-10-22](https://lenshq.io/pricing/), [Marketplace, displayed date 2026-10-06](https://docs.lenshq.io/k8slens/extensions/marketplace/)
- **Local development:** Preferences → Extensions → Install from File System selects an extension folder's `package.json`. Lens loads `dist/index.js`, remembers the local manifest path and leaves the folder in place. The published procedure does not describe uploading our existing `.tgz`; extracting it would still leave the code incompatible with the new contract. [Install an extension, displayed date 2026-10-06](https://docs.lenshq.io/k8slens/extensions/load-extension/)
- **Marketplace:** the documented distribution path is a public npm package with the `lens-extension` keyword. Lens supports publishing through its UI or `npm publish --access public`. This is unnecessary for a local verification spike. [Publish an extension, displayed date 2026-10-06](https://docs.lenshq.io/k8slens/extensions/publish-extension/)
- **Our publishing state:** [package.json](../../package.json) has `private: true`, `license: "UNLICENSED"`, no marketplace keyword and only the Freelens artifacts. npm refuses publishing when `private` is true. Public distribution therefore needs a deliberate packaging and license decision; this research changes neither. [npm package.json reference, undated; checked 2026-10-22](https://docs.npmjs.com/cli/configuring-npm/package-json/)
- **Source visibility:** Lens documents public npm distribution with either public or private Git source. A private source repository does not make the npm package private. [Share the source on Git, displayed date 2026-10-05](https://docs.lenshq.io/k8slens/extensions/share-extension-source/)
- **Enterprise policy:** organizations can forbid local extensions or publishing, allow/block named packages and versions, and require installations. These controls can prevent a technically compatible extension from running. [Extension governance, displayed date 2026-09-30](https://docs.lenshq.io/k8slens/extensions/extension-governance/)

## What differs from our package

The current Lens scaffold exports a `Feature` through one CommonJS `dist/index.js`. It prohibits split chunks, dynamic imports and requiring Node built-ins such as `fs`, `path` or `os`; saved state is scoped to a stable feature ID. [Create an extension, displayed date 2026-09-30](https://docs.lenshq.io/k8slens/extensions/create-extension/)

| Area | Verified local implementation | Consequence for a Lens port |
| --- | --- | --- |
| Entry and registration | [package.json](../../package.json), [main.ts](../../src/main.ts) and [renderer/index.tsx](../../src/renderer/index.tsx) expose separate `out/main-0.1.20.js` / `out/renderer-0.1.20.js`, with classes extending `Main.LensExtension` and `Renderer.LensExtension`. The renderer registers `clusterPages` and `kubeObjectMenuItems`. | Implement the current `Feature` and contribution mechanism; changing the package name or `engines` is insufficient. |
| SDK and shared libraries | [build.mjs](../../scripts/build.mjs) rewrites SDK/React/MobX imports to `global.LensExtensions`, `global.React`, `global.Mobx` and other globals. The manifest pins `@freelensapp/extensions`/core 1.10.3 and React 17 in development dependencies. | Replace the global shim with the modules supplied by the exact Lens build. Current documentation does not establish that these legacy globals exist. Do not assume a current React version from documentation examples. |
| Log target and snapshots | [adapter/freelens.ts](../../src/adapter/freelens.ts) obtains the active cluster, reads Pod metadata and calls `Renderer.K8sApi.podsApi.getLogs` with `container`, `tailLines: 1000`, `timestamps: true`, `follow: false`, `previous: false`. | Supply the same `SnapshotPort` behavior through current supported APIs; verify exact original text, errors and cluster/UID identity. General Kubernetes access does not prove this convenience API survives. |
| Durable settings and recovery | [configuration-store.ts](../../src/adapter/configuration-store.ts) uses `Common.Store.ExtensionStore`, main/renderer synchronization and `node:path`. [configuration-file.ts](../../src/adapter/configuration-file.ts) uses Node filesystem/crypto APIs for validation, verified backups and reset. | Replace the host store and direct filesystem work. Persistence is advertised, but equivalent backup/recovery primitives and migration guarantees remain unverified. |
| Visibility, disposal and clipboard | [main.ts](../../src/main.ts) uses `Main.Ipc` and Electron `BrowserWindow`; [window-visibility.ts](../../src/adapter/window-visibility.ts) observes native windows/navigation; [clipboard.ts](../../src/adapter/clipboard.ts) imports Electron clipboard. | Find supported current lifecycle, visibility and clipboard capabilities. No public source checked establishes that direct Electron access or the old IPC classes are available. |

Lens checks **runtime `dependencies` and `peerDependencies`** against the versions it serves for React, MobX and `@k8slens` packages. It can choose an older compatible extension release or reject all versions. Authors obtain the versions from the generated reference and declare appropriate ranges. Our SDK development dependencies and global shim do not express that contract. Passing dependency checks alone would not establish correct runtime behavior. [Compatibility matrix, displayed date 2026-09-30](https://docs.lenshq.io/k8slens/extensions/compatibility/)

## What can be reused, and what remains unknown

**Source-based inference:** much of the behavior can remain shared. The modules under [src/core](../../src/core/) import other core modules, without a host SDK dependency: parsing, formatting, profile selection, bounded snapshots, request state and inspection are promising reuse points. [session.ts](../../src/core/session.ts) already defines `SnapshotPort`; [configuration.ts](../../src/core/configuration.ts) defines `ViewerPreferences`.

The renderer is **not already a host-independent package**. [viewer.tsx](../../src/renderer/viewer.tsx) directly imports `freelensPort`, shared Freelens request state, visibility and the Electron clipboard adapter. Extract or inject these dependencies before sharing the viewer between host packages, and test against Lens's actual supplied React/runtime.

Unknown until a build-specific reference and runtime are available:

1. Exact current package names, versions, `Feature` shape and tokens for resource actions and custom dock tabs.
2. Whether a supported raw log read preserves every transport line and Kubernetes timestamp required by our contract, including denial/404 handling.
3. Availability of visibility, disposal, clipboard, settings validation and backup/reset capabilities sufficient to preserve current behavior.
4. Tab ownership across cluster switches, target UID changes, disable/uninstall and restart.

This report does not use the still-online [v6.0.1 extension API reference](https://api-docs.k8slens.dev/) or old OpenLens examples as evidence for current Lens APIs. The official October 2026 release supersedes historical statements that current Lens has no extensions. Neither legacy compatibility nor an undocumented sandbox workaround is established here.

## Smallest future verification spike

Use one exact premium-enabled or trial Lens build and a disposable local extension; do not publish it. The immediate prerequisite is the generated reference: the parent investigation found neither a `lens` executable on `PATH` nor that reference on this machine. This limits the present verdict to source-level feasibility.

1. Record the Lens version and retain its generated capability reference and served dependency versions. Create the stock scaffold and verify that it loads, using the documented single-bundle rules.
2. Add one Pod action opening a custom **dock** tab with only cluster/namespace/Pod UID/container identity. Verify that this occupies the desired dock alongside Logs; a separate main-view fallback is a separate UX decision.
3. Implement only `SnapshotPort`: read one Pod and one bounded current-container snapshot from a controlled fixture using supported APIs. Compare received originals and identity/errors before adding the viewer.
4. Prove one setting across a normal quit/reopen, then verify view disposal/visibility and clipboard. Check whether backup/reset requirements can be met through supported capabilities. A missing surface is a concrete blocker to report, not a reason to bypass the sandbox.
5. Only after these host contracts pass, connect the shared core and adapt the renderer. Record the exact build and bundle hashes for any compatibility claim.

No installation, login, subscription change, publication, commit or push is part of this research.
