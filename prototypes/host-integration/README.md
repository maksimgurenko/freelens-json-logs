# Disposable Freelens host integration spike

Observed **2026-10-21, America/Cancun** (2026-10-22 UTC) for [Validate the Freelens host integration with a disposable spike](https://github.com/maksimgurenko/freelens-json-logs/issues/7), under [Readable JSON logs first-release specification](https://github.com/maksimgurenko/freelens-json-logs/issues/1).

**The maintainer accepted the host-integration proof in the live session: “yes”.** This is disposable evidence, not the production extension or approval of its placeholder interface. Keep this branch out of main; open no PR.

## What worked in the real host

| Observation | Evidence |
| --- | --- |
| The extension action appears in the Pod details header action group, after the native Logs icon and before Edit. Clicking it opens the registered cluster page with namespace, Pod name and UID intact. | [Header screenshot](evidence/header.png), [toolbar DOM and coordinates](evidence/header.json) |
| `single-json/json` returned exactly one timestamp-prefixed line: 113 UTF-8 bytes including the trailing newline, one parsed object, and the exact known application payload. Nanosecond timestamp text is retained separately. | [Snapshot facts and original line](evidence/single-json.json), [page screenshot](evidence/single-json.png) |
| Changing only `timestamps` to false for the same fixture returned the empty string from the public SDK. This promotes the earlier source inference to an observation in this host/cluster. | [Diagnostic result](evidence/untimestamped-and-marker.json) |
| Selecting `single-json/empty` clears the window and reports Empty logs with zero returned bytes/lines; automatic mode remains active. | [Empty-container observation](evidence/empty.json) |
| Reopening from the second Pod transfers its different UID correctly. Its `json` container yielded 393 parsed objects at capture; switching to `plain` yielded 393 plain-text records with no parsed objects or retained JSON rows. | [Changing JSON](evidence/changing-json.json), [changing plain text](evidence/changing-plain.json) |
| Pause prevented another automatic request over 3.4 seconds. Refresh while paused made exactly one request, accepted a newer snapshot (427 → 429 records), and remained paused. | [Pause and manual refresh](evidence/pause-refresh.json) |
| Editing the marker in the renderer reached the main-process reaction and the configuration file. Every original host process exited, a new main PID started, and both main activation and the reopened page recovered the marker without re-entering it. | [Before-restart main output](evidence/main-before-restart.txt), [process exit/restart record](evidence/restart-processes.json), [after-restart main output](evidence/main-after-restart.txt), [reopened page state](evidence/after-restart.json), [screenshot](evidence/after-restart.png) |
| An invalid container request rejects with a plain object, not an `Error`; the Kubernetes 400 Status is nested in `error`, with text in `messages`, and no top-level `message`. This is not a denied-access test. | [Invalid-container result](evidence/invalid-container.json) |
| Disabling removes the Pod-header action and page. Uninstalling removes the package. The experimental store survives uninstall and was then removed explicitly. | [Disabled contributions](evidence/disabled.json), [cleanup record](evidence/cleanup.json) |

The required navigation, timestamped-snapshot and real-restart persistence proofs passed **after a fresh launch**. The local installation procedure still needs its own decision, below.

## Host, build and package

- Installed Arch package: `freelens-bin 1.10.3-1`; runtime reports Freelens **1.10.3**, Electron **41.10.0**, Chromium **146.0.7680.216**, Node **24.18.0**, Linux x64.
- Packaging machine: Node **26.12.0**, npm **12.2.1**.
- Disposable package: `freelens-readable-logs-host-spike@0.0.1`, approximately **4.4 kB** compressed / **12.4 kB** unpacked. Its manifest points to `out/main.js` and `out/renderer.js`; `out/store.js` is shared.
- The package uses CommonJS with `exports.default`. It reads the same host globals the researched build shims expose: `global.LensExtensions`, `global.React`, `global.Mobx`, `global.MobxReact`. There are no installed/bundled runtime dependencies or duplicate React/MobX copies. The host mounted the React page successfully.
- This minimal JavaScript spike uses syntax checking and a file-copy build. **It is not a TypeScript/SDK compilation proof**, and it does not validate a production bundler. The lockfile has no dependencies. The source-contract investigation remains the reference for the later typed implementation.
- The runtime exposes `ReactDOM`; `ReactDom` is undefined, matching the source discrepancy noted in the [pinned contract investigation](https://github.com/maksimgurenko/freelens-json-logs/blob/5dc78b5ce925bbcab6ea27d43f720010b79e1ea4/docs/research/freelens-1.10.3-integration-contract.md). This spike imports neither.

Build and inspect from this directory:

```sh
npm ci --ignore-scripts
npm run package
tar -tzf freelens-readable-logs-host-spike-0.0.1.tgz
```

The tarball contains exactly the three `out/*.js` files and `package.json`. Syntax checking, packaging and inspection passed. Captured observations were checked against the fixture's exact payload and the displayed target identities. No production extension was built.

## Reproduce the live proof

Use the disposable fixture cluster from [Provide a Kubernetes test context for the host integration spike](https://github.com/maksimgurenko/freelens-json-logs/issues/9), whose setup is on `prototype/host-test-cluster`. Its context is `kind-freelens-json-logs-spike`, namespace `readable-logs-spike`, with Pods `single-json` and `changing-logs`.

1. Build the tarball above. In Freelens 1.10.3, open **Extensions**, enter its absolute path, and click **Install once**. See the installation limitation below; the only successful evidence here is from a fresh launch after installation.
2. Open the fixture cluster → Workloads → Pods → `single-json`. Hover the `{}` icon beside native Logs in the details header: its tooltip is **Readable logs (host spike)**. Click it.
3. Confirm the cluster ID, namespace, Pod name and fetched UID agree with the selected Pod. The cluster name remains in the native sidebar. The selected container is `json`, from the Pod's default-container annotation. Confirm one timestamped raw line and one separated parsed object. The application payload is:

   ```json
   {"level":"info","message":"freelens-json-logs-spike","sequence":1,"fixture":true}
   ```

4. Pause, then use **Diagnostic: request without timestamps**. Its result is a string with `raw: ""`, while the retained timestamped snapshot still contains the record. This control exists only to demonstrate the SDK edge case.
5. Select `empty`; confirm Empty logs, zero records and no previous JSON rows. Open `changing-logs` through its own header action; switch between `json` and `plain`. Pause and Refresh to observe newer snapshots without resuming automatic mode.
6. Enter a harmless marker in **Saved marker**. The actual experimental configuration path is `~/.config/Freelens/extension-store/freelens-readable-logs-host-spike/host-spike-marker.json`. Wait until the main writer/file contains the marker before restarting.
7. Quit and reopen the full host, then reopen the same Pod action. Confirm the marker without re-entering it. The recorded run used SIGTERM for the main process and remaining children, verified every original PID exited, and started a fresh host process. No SIGKILL was required for this persistence run. This proves full-process recovery; it does not separately verify GUI Quit behavior or crash safety.
8. Disable and uninstall the disposable package through Extensions. Check the header action disappears. Remove only the experimental marker file/directory if cleaning up its saved state. Keep unrelated extensions and data intact.

The captures were obtained through the local Electron debugging endpoint and normal host UI controls/public extension APIs, with real Kubernetes calls. They are not mock-host results. Debugging is not an extension runtime dependency. No kubeconfig credentials, authentication headers or real application logs are committed.

## Installation limitation requiring another decision

The first live installation into the already-running host, with both root and cluster frames active, entered repeated enable/disable cycles. A one-second terminal check counted **77 main activations**. An accidental second Install invocation also opened a reinstall prompt, so this run does not isolate the cause. A [log excerpt](evidence/hot-install-loop-excerpt.txt) captures the cycling. The same unchanged tarball became stable after a fresh launch. Disable and uninstall later succeeded without cycling.

An installation-time synchronization race was a hypothesis, not a demonstrated cause. Do not infer that all installations fail, that the host is defective, or that restart is an approved release procedure. [Choose a reliable local installation and activation procedure](https://github.com/maksimgurenko/freelens-json-logs/issues/10) owns the focused reproduction and human decision on a supported install/update/activation sequence. It must settle before final acceptance.

## Limits and implications for the specification

- This is placeholder rendering, not the nearly indistinguishable native Logs experience. The existing native log dock remained visible below the independent cluster page. Its position, scrolling, inspection layout and formatting profiles remain with [Choose the readable log viewer interactions with a disposable prototype](https://github.com/maksimgurenko/freelens-json-logs/issues/6).
- `getLogs` was called with an explicit container, `tailLines: 1000`, `timestamps: true`, `follow: false`, and `previous: false`. The fixture had fewer than 1,000 lines in the captures. This does **not** demonstrate clipping a larger tail or the 5 MiB retention path. The spike contains a basic suffix budget, but production byte accounting and oversized-record behavior remain to implement and validate.
- Requests settled quickly. Naturally pending pause/container-switch races, same-target queued refresh, stale failures and disabled-extension pending responses were not reproduced. A disposable CDP response-interception attempt caught no matching requests and therefore provides no evidence about them. The generation guard is code, not proof of host transport cancellation.
- Whole-window visibility/minimize, cached hidden cluster frames, switching to another cluster, Pod replacement, container restart, log access denial, oversize records, network failure and a hung request were not exercised. There is only one cluster and no denied-log identity in the fixture. The existing product contract remains intended behavior, not something this spike has fully verified.
- UID equality is checked when loading the Pod; this does not make later log reads atomically UID-bound. The prototype's initial container handling and lifecycle checks are not a complete implementation of the agreed production contract.
- The marker proves main/renderer synchronization and disk recovery for one string. It proves neither formatting-profile schemas/migrations nor conflict handling, lossless crash recovery or a public storage flush acknowledgment.
- Error display must handle rejection objects rather than assuming `error.message`. `timestamps: true` is a demonstrated requirement for the chosen convenience API with a single JSON record.

## Cleanup state

After human acceptance, the spike was disabled and uninstalled through the host UI; its package was absent and its Pod-header action disappeared. The one experimental marker file was subsequently removed explicitly. The fixture cluster remains available for the map's remaining native-interface and installation decisions; see the fixture branch for its named-cluster cleanup command. No broad Docker or Freelens cleanup was performed.
