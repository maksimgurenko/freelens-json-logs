# Test reuse and host selection for Freelens 1 and 2

Research for [Establish test reuse and host-selection requirements](https://github.com/maksimgurenko/freelens-json-logs/issues/52), under [Map: Shared-core compatibility for Freelens 1 and 2](https://github.com/maksimgurenko/freelens-json-logs/issues/50). Extension source is pinned to `87e2a0b568ed68835badb4ca97173d9655db442a` (`0.1.36`); v2 source is `/home/max/work/freelens2` at clean upstream `c02289f23422d9512544de3c506605296433e999` (`2.0.1-0`). All repository links below are immutable. This is a source audit: no dependencies installed, tests executed, hosts built/launched, desktop operated, or integration pass claimed.

The evidence supports substantial reuse: **18/30 Node test files (60%) import production code only from `src/core`**. Most remaining tests already inject clocks, workers, senders, DOM geometry or SDK stand-ins. Preserve those behavior assertions; distinguish one execution of common logic from repeating shared assertions against each selected host/runtime. This finding does not settle adapter boundaries, packaging, supported version ranges or CI architecture.

## Inventory and counting method

The `test` command selects `tests/*.test.ts` and `tests/*.test.mjs`: **29 TypeScript + 1 JavaScript = 30 files**. Across those files, `^\s*test\(` has **164 lexical call sites**; 90/164 (54.9%) occur in the 18 core-only files. These are source counts, not executed test cases: loops expand registrations, so neither 164 nor 90 is a pass count. Direct core imports occur in **25/29 TypeScript files (86.2%)**, including mixed adapter/main/renderer tests; that larger number must not be presented as pure-core coverage. Reproduce by globbing the two patterns, counting the regex, and classifying relative `../src/` imports. The runner and representative mixed imports are at [package.json:19–27][pkg], [lifecycle.test.ts:1–9][lifecycle] and [find-service.test.ts:1–5][service].

| Exclusive Node-file group | Files / 30 | Existing scope and representative evidence |
| --- | ---: | --- |
| Core-only imports | 18 (60%) | `records`, `snapshot`, `session`, `refresh`, `profiles`, `matching`, `inspection`, `navigation`, `occurrences`, plus `find-editing`, `find-fields-selection`, `find-history`, `find-marks`, `find-matcher`, `find-presentation`, `find-protocol`, `find-selection`, `find-state`. Parsing, retention, configuration data, occurrence identity, lifecycle policy and Find algorithms; [session:3–59][session], [profiles:1–15][profiles]. |
| Find client/ranges/execution/service | 4 (13.3%) | `find-client`, `find-ranges`, `find-execution`, `find-service`: protocol races, startup/deadlines, ownership, worker disposal. Injected events and workers; [service:7–40][service]. |
| Mixed lifecycle/settings adapters | 2 (6.7%) | `lifecycle`, `recovery`: session policy plus visibility and filesystem/SDK-store behavior; [lifecycle:1–9][lifecycle], [recovery:85–128][recovery]. |
| Local DOM/viewport helpers | 4 (13.3%) | `local-back`, `local-dismissal`, `shortcuts`, `viewport`: local event ownership, dismissal and scroll anchoring. Fake geometry includes a React 17 synchronous-callback regression; [viewport:20–46][viewport]. |
| Verification-harness contracts | 2 (6.7%) | `ui-policy` and `find-test-transport`: desktop gates and ordered HTTP transport; [ui-policy:10–48][policy], [find-test-bridge:14–37][bridge]. |

Separate from that denominator are **five `*-browser.jsx` modules**: identity imports presentation, marks, integration and performance. One runner builds the production renderer/main, serves a fixture and fonts, and uses headless Chromium plus the actual trusted worker through an HTTP bridge. It supplies Kubernetes, SDK, filesystem and clipboard stand-ins; it evaluates CommonJS with `new Function`. Settings synchronization includes a saved profile during a held Find reply. These are useful mounted behavior regressions, not host installation, real clipboard or native input evidence. [verify-find-identity:19–40][browser-runner], [identity:1–9, 63–90, 193–227][identity].

There are **three smoke workloads** (`tests/smoke/core.mjs`, `find.mjs`, `renderer.jsx`) under one resource runner. Core/main and Find run in isolated Node processes; renderer uses Chromium and the bridge. Separate `test:workers` executes 20 supersession/inactivity cycles with a real built worker and production scheduler. Package verification extracts the tarball, checks exact contents/dependency inputs, loads entries with SDK globals and runs worker/service checks outside the checkout. [resource-smoke:46–79][smoke], [worker verification:7–53][workers], [check-package:11–61][package-check].

CI has **one Linux verification job** (`ubuntu-24.04`) plus a tag-only publishing job; it runs typecheck, Node tests, **nine Python observer test methods** against owned fake Unix sockets, browser, worker, smoke, package and reproducible-byte checks. It contains no installed Freelens launch or Kubernetes journey. The Python suite expressly marks other platforms unverified. [ci.yml:18–79][ci], [observer tests:1–33][observer-tests].

The installed-host directory separately contains **74 immediate files**: 63 `.mjs`, seven `.py`, one `.cjs`, one display-package manifest and two Markdown guides. This is a helper/fixture/scenario inventory, not 74 tests. Preparation requires the existing `kind-freelens-json-logs-spike` context; display dependencies are checksum-verified and extracted locally. Historical scenario/package/run restrictions must be adapted explicitly, retaining private-session guards. [installed-host README:8–45][host-readme]

## Reuse and gap matrix

“Once” means a common implementation/environment need not be multiplied merely because two hosts exist. “Per target” means the same assertions need evidence from each selected artifact/runtime; it does not mean copying tests.

| Surface | Reuse opportunity | Execution and remaining gap |
| --- | --- | --- |
| Parsing, recent log window, record occurrence, profile/configuration data, Find semantics | Existing core-only inputs/assertions remain host-independent. | Once per shared-core change in a declared reference runtime. Actual adapter delivery of equivalent inputs still needs each host. [session][profiles] |
| Find controller, deadline, range and shutdown policy | Keep deterministic clock/transport/worker tests; ownership rejects foreign frames and shutdown awaits actual exit. | Once for unchanged common policy. Repeat packaged worker/service assertions per distinct output and Node/Electron runtime; fakes cannot establish real SDK frame ownership or teardown. [service:29–101][service], [workers:49–53][workers] |
| Visibility, Pod reads, settings recovery and synchronization | Reuse scenarios and expected results with adapter-specific setup. | Per adapter for port contracts; per host for Pod header action → viewer, inactive/active transitions, disable/uninstall/shutdown, and preferences saved/reloaded within that host. Current recovery SDK is a stub. [freelens adapter:28–70][adapter], [recovery:85–128][recovery] |
| Browser/Find/viewport presentation | Keep shared query, history, hidden-source, marks, selection and retained-result assertions. | Per selected React/MobX generation and renderer output. Replace setup/load mechanics, React mount APIs, fonts and clipboard boundary as needed; Chromium remains a stand-in. Real per-host Find/native integration remains separate. [identity][browser-runner], [viewport:26–29][viewport] |
| Resource and package tripwires | Reuse workloads, artifact inspection and leak/cleanup assertions. | Per distinct package/runtime composition. Existing budgets are isolated regression thresholds, not portable host-memory promises; preserve the accepted host watch-timer limitation. Recalibration requires evidence, not relaxed criteria. [resource-smoke guide:20–102][resource-guide], [specification:246–267][spec] |
| Desktop policy and ordered test transport | Shared harness behavior has no host-generation semantics. | Once when unchanged; keep guards when adapting launch/CDP. Fake-socket tests do not establish compositor acceptance. [policy][bridge][observer-tests] |

Within-host saved preferences remain required: profile identity/order/default, inspection layout, safe corrupt/future-settings fallback and reset behavior. Existing schema-1/2-to-3 tests concern extension data schemas, **not cross-version transfer between Freelens 1 and 2**. That transfer/migration is explicitly deferred in [Map: Shared-core compatibility for Freelens 1 and 2](https://github.com/maksimgurenko/freelens-json-logs/issues/50) and [Establish test reuse and host-selection requirements](https://github.com/maksimgurenko/freelens-json-logs/issues/52) and recorded as a known issue by the maintainer; add no migration test or gate to this increment. [profiles:124–139][profiles], [recovery:18–79][recovery]. Windows/macOS stay explicitly unverified, with no new suites; completed Linux Find acceptance is the regression baseline. [specification:246–259][spec]

## Host assumptions that need explicit selection

| Current assumption | Exact v2 contract and consequence |
| --- | --- |
| Build emits CommonJS for all three entries and rewrites imports to `global.LensExtensions`, `React`, `ReactDOM`, etc. | C2–C4 require `FreelensExtensionApi`, with `ReactDom` under that object; renderer is ESM. Main accepts CJS/ESM, but only ESM reloads. Select loader/global mapping by target; changing a label cannot make the old package compatible. [build:4–28][build], [api:54–239][api] |
| SDK/core `1.10.3`, React 17, MobX 6; package checks hardcode these values. | Pinned v2 catalogs contain React/DOM `19.3.1`, MobX `7.0.6`, mobx-react `10.0.2`, Electron `44.10.0`. Host singleton identity needs checking: a second MobX instance can silently fail. V2 has only one public SDK package; internal-core font paths are unsuitable as its consumer dependency. [package.json:29–41][pkg], [package check:25–52][package-check], [v2 catalog:11–17, 56][catalog], [api:C1/C3][api] |
| Renderer fixture supplies Node `fs/path/crypto` and Electron clipboard. | C4 promises browser capabilities plus SDK only. Move or adapt Node work through the chosen seam; assert browser rendering without accidental Node availability. Current clipboard interception cannot prove `navigator.clipboard` delivery. [identity:81–88][identity], [configuration-store:1–31][store], [migration:1515–1585][migration] |
| Single mixed DOM/Node compiler program uses `node10` resolution and ES2022 libraries. | V2 C13 requires modern export resolution and ES2024 libraries; C4 describes environment-specific checking. Select consumer SDK/types and main/renderer environment checks; a passing v1 typecheck says nothing about v2. [tsconfig:2–24][tsconfig], [api:201–208, 914–939][api] |
| Installed helpers select ticket/run, not host generation; launch is `/usr/share/freelens/freelens`. Driver/observer use absolute paths and `0.1.34` CJS entries. | These require selectable executable/artifact/inspection bindings. Background helper waits for `global.LensExtensions` on 9235; private helpers use 9241/9242, renderer `process` access and `require`/`process.mainModule` instrumentation. Their isolation checks remain useful, but these probes need v2-specific adaptation. [launch:9–22][launch], [driver:19–29, 52–59][driver], [host-cdp:8–45][host-cdp], [private CDP:8–62][cdp], [observer.cjs:4–15][host-observer] |

The v2 compatibility gate is especially relevant to artifact selection: it coerces the declaration's leading major/minor and reconstructs `^major.minor`; it does not evaluate an arbitrary full semver union. Do not assume `1.10.3 || ^2.0.0` admits both hosts. The supported range/package strategy is a later decision. [is-compatible-extension.ts:19–39][compatibility], [api:C14][api]

Useful retained surfaces include `Main.Ipc.handle`, whose handler still receives `Electron.IpcMainInvokeEvent`, and `Common.Store.ExtensionStore`. V2's store owns persistent-storage synchronization and registers a disposer; its path uses user data, `extension-store` and `storeName`. These facts support reusing ownership/settings scenarios but cannot validate the extension's current store constructor or synchronization behavior against v2. [ipc-main:68–87][v2-ipc], [base-extension-store:82–128][v2-store]

## Configuration facts a trustworthy run must carry

These are required identity inputs/observations, not proposed option names or a final configuration format.

| Input | Mismatch protection / recorded evidence |
| --- | --- |
| Host generation and expected application/API version | Require explicit target for host-facing runs; reject unsupported/missing targets. Verify running application version and API global in root and cluster contexts before assertions. SDK package version alone is not a runtime gate. [api:C14][api] |
| SDK/type source, compile toolchain and runtime libraries | Record resolved SDK version/digest or built SDK from pinned source, lockfile, Node/npm or pnpm, React/MobX versions and output format. Check selected singleton references are the host's instances; avoid relying solely on passing UI tests. [api:C1/C3/C13][api] |
| Source checkout/revision, build recipe and actual executable | Require v2's exact checkout/revision plus architecture and absolute unpacked executable; record hashes/build output. Reject fallback to PATH or the installed v1 executable. Bind launch PID/command/`/proc/<pid>/exe` to this identity. [v2 start scripts:23–50][v2-pkg], [launch][launch] |
| Extension artifact | Record absolute tarball path, manifest version/engines/entries and SHA-256; verify installed assets equal selected artifact, then activation in both processes. An enabled-looking UI or historical `0.1.34` probe is insufficient. [package-check][package-check], [driver][driver] |
| Transport, isolation and evidence directory | Bind CDP endpoints to the owned PID/profile/private display and correct frame, reject an existing unrelated target, partition runs by host/artifact. Preserve workspace 7, focus, pointer and clipboard continuously; never focus to satisfy a probe. [private CDP:8–62][cdp], [private-session:7–19][private-session], [UI playbook][playbook] |

Selectable fixtures may be resolved by explicit command arguments, validated named profiles or a matrix entry; facts above constrain all three options. Port numbers alone and the presence of a similarly named window do not prove generation/build identity.

## Source-build prerequisites and unanswered evidence

Read-only inspection found the v2 checkout clean at the stated revision, with **no `node_modules`, built SDK JS/declaration, `freelens/static/build/main.js`, or Linux unpacked executable**. Therefore no actual v2 runtime evidence exists from this investigation.

The documented build uses pinned Node **24.22.1**, pnpm **12.15.0**, dependencies, DI generation, `pnpm build`, then `pnpm build:app:dir`. Linux launch resolves to `freelens/dist/linux-unpacked/freelens` on x64 or `linux-arm64-unpacked/freelens` on arm64. `pnpm start` is a wrapper, not proof of executable provenance. Linux needs Electron runtime shared libraries; bundled proxy/kubectl/helm artifacts are checksum-verified from the binary lock. Electron's runtime download is lazy; upstream explicitly runs `electron/install.js` before relevant CI builds/tests. These are prerequisites to verify later, not commands performed here. [DEVELOPMENT:7–98][development], [root package:27–35, 84–86][v2-root], [v2 package:38–50][v2-pkg], [AGENTS:567–587][v2-agents]

Build and consume the SDK's distributable declaration/shim when evaluating a consumer: its source package points at workspace TypeScript, while publish configuration points at `dist`. Testing only against workspace source can miss published-contract differences. [SDK package:19–32, 86–97][v2-sdk]

Remaining questions for later decisions/experiments:

- Which package/range and adapter composition expose the same assertions to both generations, given the compatibility gate and renderer loading differences?
- Which selector interface owns SDK/runtime, artifact and executable identity without silently selecting v1?
- Does a pinned v2 build actually load/activate the chosen artifact, preserve the Pod-header action and separate viewer route, execute Find with real frame ownership, and release workers/listeners on disable, close and shutdown?
- Do profiles/defaults/inspection persist and synchronize within each host, including safe recovery? Does the React 19 renderer preserve selection, scroll anchoring and pending Find behavior?
- Which existing Linux private-session/native probes survive v2 and which require narrow adaptation? Real clipboard, IME/input, host resource behavior and integration-path isolation still require scoped runtime evidence. V2 retains the temporary `FREELENS_INTEGRATION_TESTING_DIR` convention in source, but it was not exercised. [v2 user-data path:13–25][v2-user-data]

No architecture decision, feasibility pass, settings-transfer gate or all-platform acceptance follows from this audit.

[pkg]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/package.json#L19-L41
[lifecycle]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/tests/lifecycle.test.ts#L1-L185
[service]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/tests/find-service.test.ts#L1-L107
[session]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/tests/session.test.ts#L3-L59
[profiles]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/tests/profiles.test.ts#L1-L150
[recovery]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/tests/recovery.test.ts#L18-L140
[viewport]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/tests/viewport.test.ts#L20-L46
[policy]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/tests/ui-policy.test.ts#L10-L48
[bridge]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/scripts/find-test-bridge.mjs#L1-L104
[browser-runner]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/scripts/verify-find-identity.mjs#L19-L40
[identity]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/tests/find-identity-browser.jsx#L1-L227
[smoke]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/scripts/resource-smoke.mjs#L46-L79
[workers]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/scripts/verify-find-execution.mjs#L7-L53
[package-check]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/scripts/check-package.mjs#L11-L61
[ci]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/.github/workflows/ci.yml#L18-L95
[observer-tests]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/tests/hyprland_observer_test.py#L1-L131
[adapter]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/src/adapter/freelens.ts#L28-L70
[store]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/src/adapter/configuration-store.ts#L1-L31
[resource-guide]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/docs/resource-smoke.md#L20-L105
[spec]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/docs/specification.md#L246-L267
[build]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/scripts/build.mjs#L4-L28
[tsconfig]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/tsconfig.json#L2-L24
[launch]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/scripts/find-production-host/launch.py#L9-L22
[driver]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/scripts/find-production-host/driver.mjs#L19-L59
[host-cdp]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/scripts/host-cdp.mjs#L8-L45
[cdp]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/scripts/find-production-host/cdp.mjs#L8-L62
[host-observer]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/scripts/find-production-host/observer.cjs#L4-L15
[private-session]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/scripts/find-production-host/private-session.mjs#L7-L19
[host-readme]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/scripts/find-production-host/README.md#L8-L45
[playbook]: https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/docs/agents/ui-verification.md#L1-L101
[api]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/docs/extensions/api.md
[migration]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/docs/extensions/migrating-from-v1.md#L1515-L1585
[catalog]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/pnpm-workspace.yaml#L11-L60
[compatibility]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/packages/core/src/extensions/extension-discovery/is-compatible-extension/is-compatible-extension.ts#L19-L39
[development]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/DEVELOPMENT.md#L7-L98
[v2-root]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/package.json#L27-L86
[v2-pkg]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/freelens/package.json#L23-L50
[v2-sdk]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/packages/extensions/package.json#L19-L97
[v2-agents]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/AGENTS.md#L567-L587
[v2-ipc]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/packages/core/src/extensions/ipc/ipc-main.ts#L68-L87
[v2-store]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/packages/core/src/extensions/base-extension-store.ts#L82-L128
[v2-user-data]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/packages/core/src/common/app-paths/directory-for-user-data/directory-for-user-data.injectable.ts#L13-L25
