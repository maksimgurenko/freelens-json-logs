# Freelens 2 runtime seams on the pinned local build

Observed on Linux on 2026-10-30 for
[Verify the v2 runtime seams on a local source build][ticket], under
[Shared-core compatibility for Freelens 1 and 2][map].

The prerequisite is demonstrated: the actual pinned v2 host can load an ESM
fixture, preserve the Pod-header/separate-page route, share host libraries,
synchronize and recover settings, and run the existing main-owned Find service
with sender/frame ownership and awaited worker teardown. This is feasibility
evidence for the adapter decision, not a production port or full parity verdict.

## Target and artifact identity

| Item | Observed identity |
| --- | --- |
| Extension behavior/source baseline | `87e2a0b568ed68835badb4ca97173d9655db442a`, release `0.1.36` |
| Evaluation checkout | `/home/max/work/freelens2`, clean tracked revision `c02289f23422d9512544de3c506605296433e999` |
| Built application and SDK | `2.0.1-0` |
| Build tools | Node `24.22.1`, pnpm `12.15.0`; downloaded digests verified, pnpm integrity also matches the source manifest |
| Executable | `/home/max/work/freelens2/freelens/dist/linux-unpacked/freelens` |
| Executable SHA-256 | `fe48bf9d2cb07a14e63e9adf0afa8a669872a70e6cffe130f12b560b6fbe756a` |
| Packaged `app.asar` SHA-256 | `f4fef770efa7d9518a875421d48c7c350c8bf104636395ca220f3000d75d8f3d` |
| Running runtime | Electron `44.10.0`, Chromium `152.0.7977.169`, Node `24.22.1` |
| Final disposable extension | `freelens-runtime-probe57@0.0.58`, separate `freelens-runtime-probe57` store |
| Installed fixture archive SHA-256 | `2adcb7596d248f48c76aac4046865e90987e3239d62ff2851dc3c4d250d833cf` |
| Transport | Background raw CDP, renderer `9251`, main `9252`; exact host PID/profile/display/executable guards |

[Toolchain receipt](freelens2-runtime/toolchain.json),
[build/artifact receipt](freelens2-runtime/build-provenance.json),
[running identity](freelens2-runtime/identity-1793403694710.json), and
[installed asset comparison](freelens2-runtime/installed-provenance.json)
record the identities. The build receipt's fixture hash is the initial `0.0.57`
capture; the installed receipt above is authoritative for the corrected `0.0.58`
fixture. All three selected installed entries equal the corresponding locally
built files. The SDK runtime shim and declaration hashes are recorded;
the fixture itself is JavaScript and makes no consumer type-checking claim.

The documented recipe ran successfully: frozen-lockfile install, `pnpm build:di`,
`pnpm build`, and `pnpm build:app:dir`. Respective elapsed times were approximately
4.6, 0.6, 39.7 and 24.9 seconds. Turbo reused its existing shared worktree cache
for matching package builds; the application and unpacked package were built by
the recorded commands. The source checkout's tracked status stayed empty after
each step. [Commands, statuses and complete logs](freelens2-runtime/build.json),
[install](freelens2-runtime/install.json), [DI](freelens2-runtime/di.json),
[packaging](freelens2-runtime/package.json).

Build execution used a user scope capped at 6 GiB memory, with a 4 GiB high
watermark, 1 GiB swap allowance and low CPU/IO weights. The external CDP driver
and fixture bundler ran on the machine's Node `26.12.1`; that controller is not
the runtime being validated. No globally installed host, extension or package
was replaced.

## Observations

| Seam | Observed result and evidence |
| --- | --- |
| Renderer ESM and Pod action | The real loader loaded the fixture. Its action appeared in the actual Pod details toolbar; clicking it through DOM opened its registered separate page with exact cluster, namespace, Pod name and UID parameters. The page used a real React hook without a second React copy. [Final route run](freelens2-runtime/open-1793403846921.json). |
| React/MobX ownership and reaction | React reports `19.3.1`; imported React is the host object, the imported MobX reaction is the host function, and host MobX recognizes the store observable. The host wraps the registered Page in its observer. Following recovery, the page's default Side/empty-profile state changed to Bottom/a named profile after editing, and its rendered JSON, main state and disk agreed. [Recovery defaults](freelens2-runtime/recover-1793403822311.json), [changed rendered settings and reaction](freelens2-runtime/settings-1793403847024.json). |
| Ordinary settings and restart | An actual formatting profile and inspection preference synchronized through the SDK store and persisted on disk. After a full process restart, both main and renderer recovered the same Bottom preference and named profile. [Restart assertion](freelens2-runtime/restore-1793403788054.json). |
| Disable/re-enable | With a live worker, Disable reached equal start/exit counts, no owner/opening/retiring/sender/watch state, no fixture RPC handlers, no main broadcast listener and no fixture disposers. Enable recreated exactly seven handlers and one main listener. A new Inline/profile edit propagated from root renderer to main and the cluster renderer, then Bottom was restored. This proves reattachment rather than a cached initial value. [Disable](freelens2-runtime/disable-1793403630887.json), [re-enable](freelens2-runtime/enable-1793403671684.json). |
| Malformed settings | With the host stopped, the owned settings file was replaced by explicit malformed fixture bytes. Startup preserved them exactly and exposed a problem. A canceled reset preserved them again. Confirmed reset used the existing exclusive backup/verify/replace code, produced an exact backup, and restored schema-3 defaults in main and renderer. [Seeded bytes](freelens2-runtime/malformed-settings.json), [recovery assertions](freelens2-runtime/recover-1793403822311.json). |
| RPC and Find | Main received real webContents, process/routing frame IDs, frame URL and owning BrowserWindow. The unchanged Find service/worker completed a Unicode literal match. Invoking a cluster token from the root frame was rejected. A 1,000-record request was canceled before completion through real RPC, with the worker exit awaited. [RPC, matching and cancellation](freelens2-runtime/runtime-1793403562602.json). |
| Page and document navigation | Leaving the mounted fixture page closed its actual running worker and emptied the service. Separately, reloading the real iframe retired an explicitly seeded worker owner, without renderer-assisted close, and emptied ownership/listener tracking. [Page navigation](freelens2-runtime/navigate-away-1793403568114.json), [iframe reload](freelens2-runtime/frame-navigation-1793403694975.json). |
| Active/hidden eligibility | The active cluster was eligible while its owning window was unfocused. Navigating the root to Catalog made the retained cluster ineligible while the same window remained visible and unfocused. No fake focus, visibility override or focus activation was used. [Actual visibility snapshots](freelens2-runtime/runtime-1793403562602.json). |
| Host exit | Four owned host launches exited normally with code 0. Across them, seven workers started and seven exited. Quit snapshots have zero live workers, empty service maps/watch and zero fixture disposers before proceeding to quit. SDK handler removal is directly asserted on Disable; the quit snapshot occurs before SDK disposal and retains its seven SDK-owned handlers. [First shutdown](freelens2-runtime/shutdown-first.json), [complete lifecycle events](freelens2-runtime/worker-and-lifecycle-events.jsonl), [run ledger](freelens2-runtime/run-ledger.json), [cleanup](freelens2-runtime/cleanup.json). |

## Constraints for the adapter decision

- Preserve host-owned library instances. The host already applies `observer`
  to registered page components: registering an already observed component
  failed in the initial fixture. Register a plain Page wrapper, as the current
  production registration already does. This was a fixture error, not a
  production defect. [Exact host exception](freelens2-runtime/double-observer-fixture-failure.json),
  [pinned registrator][registrator].
- Settings preflight and backup/reset work in main before constructing the SDK
  store. This fixture uses the existing pure configuration/profile model and
  recovery implementation, with a small browser-safe SDK-store binding.
  Renderer activation obtains recovery status by RPC before loading its store.
  This demonstrates that composition; it does not port the existing combined
  Node-importing production store to v2.
- Call the SDK's store binding on every successful activation. The fixture
  deliberately omits the production store's persistent `syncing` shortcut;
  observed disable/re-enable synchronization depends on reattachment. The
  SDK also stops a previous binding before making another one. [Pinned SDK store][store].
- Main ESM resource lookup can use `import.meta.url` with the shipped, versioned
  worker path. The worker remains CommonJS source evaluated by Node worker_threads;
  the existing worker-version handshake and Find ownership service work unchanged.
- Carry authoritative sender/frame identity from main RPC. Extension broadcasts
  remain a different transport. Keep actual worker-exit promises in navigation,
  deactivation and quit composition. In-page route unmount and full-document
  navigation need distinct cleanup paths.
- View eligibility must continue to use the owning window and selected root
  cluster route, independently of focus. These observations establish the tested
  active/Catalog transition; they do not establish every host window state.

These facts feed [Choose the shared core and version-adapter boundaries][boundaries].
They select no final interface or production implementation order.

## Failed runs and display limits

The [ledger](freelens2-runtime/run-ledger.json) retains **32 driver invocations**:
25 completed successfully and seven failed. These are invocations, including
setup/status/quit drivers, not 32 product test cases. The failures were fixture
or harness problems: passing a Pod rather than its self-link to `showDetails`,
waiting for hidden toolbar title text in `innerText`, the extra Page observer,
running a settings assertion before the page mounted, an unhandled install
replacement confirmation, and guessed Disable/Enable menu text. Corrected runs
are linked above; failed JSON files were not overwritten or reclassified.

Two earlier display-only attempts could not initialize stock Aquamarine 0.15.1
with the installed Hyprland 0.57.0: IPC answered `unsafe state`. No Freelens was
launched into those failed displays. Rebuilt the **existing** one-line
`wl_display_flush` output-startup diagnostic at Aquamarine
`f31c47a1b9d300847d8fc3108ad959448103dfc1`, using
[the previously captured patch](freelens2-runtime/private-aquamarine.patch.gz).
No installed compositor library was changed. The corrected private stack loaded
that library, as checked in `/proc`, and both compositors exited zero.
[Preparation observations](freelens2-runtime/preparation-notes.json),
[build log](freelens2-runtime/aquamarine-build.log.gz),
[owned session proof](freelens2-runtime/private-session-proof.json).

The resulting labwc -> nested Hyprland -> actual Freelens stack used a distinct
owned runtime, profile and workspace 7. Mutation commands targeted only that
session. There was no native input, focus activation, `Page.bringToFront`, user
clipboard operation, or Kubernetes mutation. The existing fixture context was
copied privately and used read-only.

The [corrected continuous desktop observer](freelens2-runtime/display-runtime57-ok/real-desktop.json)
reported no observer errors and no window-open/close events. It recorded focus
and workspace notifications and different pointer endpoints, so this report
does **not** claim an unchanged desktop interval or infer who caused those
movements. No owned test window appeared on the user's desktop. The original
helper did not drain events during failed startup, so its two earlier empty
event arrays are not proof of an event-free startup interval. The disposable
copy was corrected to observe concurrently from startup through teardown.

Two private Hyprland welcome/update auxiliary programs generated core files
during the failed attempts; their identities were recorded and their dumps
removed. All four hosts, all three private compositor pairs, three owned runtime
directories and the credential-bearing private profile were gone at cleanup.
The source build remains available at its requested checkout for later gates.
Unrelated original-checkout changes were preserved. [Cleanup receipt](freelens2-runtime/cleanup.json).

Raw command and display logs are gzip-compressed after capture.

## Reproduction

Use the evidence branch at `/tmp/freelens2-runtime-57` and the clean pinned
source checkout above. These are deliberately fixed experiment paths, not a
new production host-selector interface. Start from a stopped owned fixture
host and keep `FREELENS_UI_MODE` unset.

```sh
python3 scripts/freelens2-runtime/bootstrap.py
systemd-run --user --scope --unit=freelens2-runtime-build-57 \
  --property=MemoryHigh=4G --property=MemoryMax=6G \
  --property=MemorySwapMax=1G --property=CPUWeight=20 --property=IOWeight=20 \
  python3 scripts/freelens2-runtime/build.py
ln -s /home/max/work/freelens-json-logs/node_modules node_modules
node scripts/freelens2-runtime/fixture-build.mjs
tar -czf .scratch/fixture57.tgz -C .scratch --transform='s,^fixture57,package,' fixture57
FIND_HOST_TICKET=57 FIND_HOST_RUN=runtime57-ok python3 scripts/freelens2-runtime/prepare.py
```

The exact observed tarball is archived as
[fixture-0.0.58.tgz](freelens2-runtime/fixture-0.0.58.tgz). Rebuilding reproduces
the selected source assets; no byte-for-byte tarball reproducibility claim is
made. The archive also retains unused older `0.0.57` assets from the initial
fixture build; the manifest and installed receipt select only the three `0.0.58`
entries. The corrected source registers an unwrapped Page.

For the diagnostic display dependency, check out Aquamarine at the commit above,
decompress and apply the archived patch, then run CMake Release configuration and
`cmake --build <checkout>/build -j2`. On this machine CMake was extracted locally
from cached `cmake-4.4.5-1`, `rhash-1.4.6-1` and `cppdap-1.58.0-3` Arch packages;
its local `usr/lib` was supplied only while configuring/building. The recorded
configuration log lists the system development-library versions. Reuse the
documented private display route; never replace a user's compositor to satisfy it.

In supervised terminals, with the same ticket/run variables:

```sh
FIND_DISPLAY_RENDERER=mesa \
LD_LIBRARY_PATH=/tmp/freelens2-runtime-tools-57/aquamarine/build \
  python3 scripts/freelens2-runtime/display.py
# Wait for the private display's ready record; in a separate terminal:
python3 scripts/freelens2-runtime/launch.py
# Wait for matching private debug targets; then run sequentially:
node scripts/freelens2-runtime/probe.mjs install
node scripts/freelens2-runtime/probe.mjs open
node scripts/freelens2-runtime/probe.mjs settings
node scripts/freelens2-runtime/probe.mjs runtime
node scripts/freelens2-runtime/probe.mjs navigate-away
node scripts/freelens2-runtime/probe.mjs seed
node scripts/freelens2-runtime/probe.mjs disable
node scripts/freelens2-runtime/probe.mjs enable
node scripts/freelens2-runtime/probe.mjs seed
node scripts/freelens2-runtime/probe.mjs frame-navigation
node scripts/freelens2-runtime/probe.mjs seed
node scripts/freelens2-runtime/probe.mjs quit
```

Wait for launch.py's actual exit-0 record, launch the **same** private profile
again, and run `restore`. For recovery, stop the owned host first, save the valid
fixture settings, write the explicit malformed bytes and metadata recorded in
`malformed-settings.json`, launch again, and run `recover`. That driver asserts
startup preservation, canceled-reset preservation and exact backup after
confirmation. Test inputs remain confined to this fixture store. Finish with
normal host quit, create `.scratch/find/57-host/stop`, wait for both compositors,
and remove only recorded owned profile/runtime resources after preserving safe
evidence. The original run used extra inspection/failure-repair invocations;
their exact identities remain in the ledger.

## Remaining acceptance

The fixture is intentionally smaller than a production port. It does not prove
full parsing/retention/Find/inspection/profile UI parity, exact production
configuration-store composition, the final two-package build arrangement,
wrong-package compatibility policy, clipboard, shortcuts, minimization/restore,
all error classes, or long-running resource behavior. Those remain with
[Choose the shared test matrix and local-build evaluation gates][gates] and the
implementation handoff. No physical-device or stock-display acceptance is
claimed. Windows and macOS remain explicitly unverified; their suites were not
added or run. Cross-version settings migration remains deferred.

[ticket]: https://github.com/maksimgurenko/freelens-json-logs/issues/57
[map]: https://github.com/maksimgurenko/freelens-json-logs/issues/50
[boundaries]: https://github.com/maksimgurenko/freelens-json-logs/issues/53
[gates]: https://github.com/maksimgurenko/freelens-json-logs/issues/55
[registrator]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/packages/core/src/renderer/routes/extension-route-registrator.injectable.tsx#L107
[store]: https://github.com/freelensapp/freelens/blob/c02289f23422d9512544de3c506605296433e999/packages/core/src/extensions/base-extension-store.ts#L82-L113
