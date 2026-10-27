# #48 production Find verification checkpoint

Latest: [state boundaries, controlled snapshot delivery and dense diagnosis](state-completion.md).
The [source/geometry checks and grouped-mark cycling fix](geometry.md) retain their
recorded scope. Current dense interaction/resource and all native/platform gates remain open.
The earlier [snapshot/delivery](snapshots.md) and [clipping/cadence](cadence.md)
checkpoints below remain history; #48 remains unfinished and is not release accepted.

Selected **Verify production Find against the acceptance matrix** as the lowest
eligible unfinished local ticket. #47 is done at
`3fb33db5f5ded3523bcf66c1145f0af967ec0bf3`, the fixed pre-implementation/review HEAD.
Claimed before work using `gh issue edit 48 --add-assignee @me`. Live full #48
and #36/#37/#38/#40 match cached authority. Work stays on `implementation/find`.

**Partial implementation/verification checkpoint; not done or release accepted.**
[Matrix](matrix.md) records all D01–D16 cases, all 13 original state traces,
additional mandatory regressions and the native/platform gates separately.
No product behavior or execution mechanism changed. The existing real-host
harness now accepts `FIND_HOST_TICKET=48` (default 42 preserved), keeping scratch,
profile identity and evidence separate from historical #42 results.

## Package and environment

[Installed identity](host/package-identity.json), [host runtime](host/identity-final.json),
[toolchain](toolchain.txt). Freelens **1.10.3**, Electron **41.10.0**, Node **24.18.0**,
Chromium **146.0.7680.216**, Arch Linux/Wayland. Project-local npm **11.16.0**.
Package/store `freelens-readable-logs@0.1.34`; page/config `readable-logs`, schema 3.

Tarball SHA-256:
`cbc903f572d5c7b8dc6dfd09e433538dda799803e8e7549f6212bb2634046825`.
Installed main/renderer/versioned worker bytes match the current build. The
unchanged trusted worker is main-read relative to the installed main module;
actual host CWD is `/home/max`. No CSP/host/package patch or execution fallback.
The package was installed once through the real Extensions form in a fresh
private main window, without overwrite or post-install restart as proof of
successful installation. Later fresh runs provide supported lifecycle checks.

## Evidence completed

- [Actual SDK](host/sdk-suite.json): 10 grouped observations; foreign-token rejection
  in both directions between root/cluster frames sharing webContents, all four
  literal modes, actual `retainSnapshot` at exactly 1,000 records/5 MiB, range cap,
  inactive disposal, same-frame replacement awaiting startup exit, actual frame
  removal preserving the root owner, zero final owners/senders/sweep/workers.
- [Startup stall](host/startup-timeout.json): inspector pauses the actual trusted
  worker before ready; the production startup-inclusive deadline returns timeout
  in 1,000.4 ms in this observation, actual exit is observed, explicit request
  recovers. Controlled pure tests independently cover withheld late exit.
- [Real mounted viewer](host/mounted-host-viewer.json): flags/count observation,
  explicit navigation, inactivity exit, retained query/flags behavior on return
  and owner disposal. The mode-refinement assertion is unresolved as below.
- [Lifecycle](host/extension-lifecycle.json): supported fresh-main-window Disable
  during startup, Enable, Uninstall with idle worker, one-submission reinstall and
  recovery. Actual exits, empty owner/opening/retirement/sender maps, no sweep,
  removed SDK handlers and before-quit hook; old SDK calls reject.
- [Churn](host/actual-host-churn.json): 20 bursts of 20 real SDK requests, newest
  reply only, no overlapping workers, actual exit on inactivity and final cleanup.
- [Integrated renderer](host/integrated-acceptance.json): 28 Host DOM checks against
  owned real Kubernetes snapshots, current packaged renderer and production SDK.
  Reading origin/refinement/correction/replacement, wrap, source-safe Custom
  Highlights and retained source node/DOM selection, both hidden source actions,
  exact extracted representation, Range seeding/history, black canvas/separate bar.
- [Installed SDK resource soak](host/installed-sdk-soak.json): three warmups then
  20 samples per bound, using real retained Kubernetes logs (1,000 records,
  4,832,000 bytes; one long source, 5,242,784 transport bytes). Actual worker
  creation, range work, inactivity, explicit reactivation, close and GC/resource
  observations; no owners/senders/sweep/workers after each close. Samples are
  short-run evidence, not a long-duration plateau guarantee.

The full appropriate regression suite was rerun with pinned toolchain: locked
install, typecheck, **246/246 tests**, six desktop policy checks, mounted production
browser, actual worker scheduler, preserved/extended resource smoke, strict packed
allowlists/host globals/versioned worker from non-checkout CWD, and two-build
SHA-256 reproducibility all pass. See logs in this directory. Host results remain
separate from SDK/OS stand-ins in the browser/resource test programs.

## Reproduction

Run from this checkout. Keep `FREELENS_UI_MODE` unset. Read
`docs/agents/ui-verification.md` before any host operation.

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
node --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js ci --ignore-scripts --no-audit --no-fund
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run typecheck
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js test
python3 -B -m unittest discover -s tests -p ui_desktop_test.py -v
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run test:browser
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run test:workers
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run test:smoke
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run check:package
sha256sum dist/freelens-readable-logs-0.1.34.tgz
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
sha256sum --check docs/verification/48/package-sha256.txt
export FIND_HOST_TICKET=48
python3 scripts/find-production-host/prepare.py
# Separate supervised long-lived commands:
python3 scripts/find-production-host/display.py
python3 scripts/find-production-host/launch.py
node scripts/find-production-host/install.mjs
node scripts/find-production-host/cdp.mjs 9242 main scripts/find-production-host/observer.cjs
node scripts/find-production-host/open-view.mjs
node scripts/find-production-host/viewer.mjs
node scripts/find-production-host/suite.mjs
node scripts/find-production-host/timeout.mjs
node scripts/find-production-host/quit.mjs
# Wait for owned app exit; fresh main window for Extensions maintenance:
python3 scripts/find-production-host/launch.py
node scripts/find-production-host/cdp.mjs 9242 main scripts/find-production-host/observer.cjs
node scripts/find-production-host/lifecycle.mjs
node scripts/find-production-host/churn.mjs
node scripts/find-production-host/open-view.mjs
python3 scripts/find-production-host/fixtures.py
node scripts/find-production-host/acceptance.mjs
node scripts/find-production-host/soak.mjs
node scripts/find-production-host/mounted-soak.mjs
```

The fixture script creates a unique UID-checked, labelled namespace and one Pod
with pinned busybox containers; it never changes shared spike fixtures. The
private profile holds only a private copy of the existing fixture kubeconfig;
it is not committed. Delete only the owned namespace using `fixtures.py delete`.
Cleanup and continuation details are appended below.

## Failed/unperformed checks and release limits

- **Unresolved mode-refinement gate:** the original #42 probe observed `0 of 1`
  after typing and immediately toggling both modes, against live snapshots. The
  accepted #37 contract treats mode toggles as refinement: retain a matching
  candidate or seek from the current position. An interim assertion accepting
  zero as mode maintenance was incorrect; independent Spec review caught it.
  The original `1 of 1` assertion is restored. The later raw observation still
  supplies inactivity/teardown measurements, but is not a mode-refinement pass.
  Isolate initial snapshot/refresh timing and assert each toggle against the
  original contract; no changed behavior or production defect is inferred yet.
  Initial viewer and resulting suite/timeout owner-precondition failures remain
  in `*-initial.json`; they are not passing checks.
- Private NVIDIA-backed nested Hyprland has a **0×0 output**; normal animation
  frames stall. Two owned AMD/Mesa setup attempts failed initialization and are
  retained (`amd-initial-*`, `mesa-attempt-*`). They changed no user compositor or
  production configuration. The original private setup remains for SDK checks.
  Host DOM rendering uses background `Page.captureScreenshot` to drive actual
  frames. This neither fakes focus nor proves natural native presentation cadence.
- Initial DOM-selection probe changed selection on a still-active Find input;
  corrected probe focuses a row programmatically before creating its source Range,
  as in the accepted browser seam. Identical-route reuse retained Pause in one
  rerun; the probe now leaves the viewer and waits for teardown before reopening.
  Both failed attempts remain. No production correction was required.
- Initial SDK disk traversal followed Chromium Singleton symlinks; corrected
  footprint uses `lstat` and does not follow symlinks. Initial evidence is retained.
  Initial mounted long-source probe waited for an off-screen far-end hit while
  wrap was off; the corrected workload enables wrap and scrolls to visible source.
- Physical pointer/keyboard selection, system clipboard, native paste/Undo/Redo,
  IME/AltGraph, modifier shortcuts/menus/OS focus and physical close-button
  delivery are **unverified**. No native input, clipboard access, focus override,
  window activation/minimize/restore or user-pointer operation was used.
- Windows and macOS matching/worker/package, modifier, IME, selection/copy, focus
  and lifecycle checks are **unverified**; no such sessions are available.
- Remaining autonomous Host DOM/snapshot/state/geometry gates are listed in the
  matrix and continuation. They must not be silently replaced by pure/browser
  results. No accepted product mechanism was invalidated by current evidence;
  the compositor problems are test-environment limitations.

No push, merge, PR, release, GitHub comment/closure, shared fixture modification,
or user configuration write is authorized or performed. The working checkout is
not a clean release checkout. Original dirty glossary/docs and unrelated scratch,
design, `.gitignore` and Ralph data remain outside the ticket commit.

## Mounted resource gate: failed, attribution unresolved

[Mounted soak measurements](host/mounted-soak.json) ran three warmups then six
measured cycles at each bound through the installed real viewer, current package,
real Kubernetes snapshots, real SDK worker, active/inactive return and complete
viewer teardown. Visible highlights and marks, retained Pause, actual worker exit,
zero owners/senders/sweep and empty highlight registry after teardown all passed.
The resource measurements **do not pass**. Across first/last post-warmup samples:

| Bound | DOM nodes growth | JS listeners growth | Renderer heap growth | Renderer RSS growth |
| --- | ---: | ---: | ---: | ---: |
| 1,000-record dense | +47,724 | +5,259 | +34,524,720 B | +91,705,344 B |
| Single near-5-MiB source | +9,065 | +252 | +2,534,340 B | +2,174,205,952 B |

These exceed the existing smoke retained-object investigation limits (128 nodes,
8 listeners, 8 MiB renderer heap). Those conservative limits flag investigation;
they do not by themselves attribute a leak to the extension rather than Freelens,
DevTools/console retention, screenshots or the private compositor. Main resources
and SDK-only soak remain separately scoped. Full per-sample records include
main/renderer heap/external/RSS, DOM/documents/listeners, thread counts, actual
worker starts/exits and SDK owner state. The SDK-only soak additionally records
private-profile disk footprint (dense unchanged; long +405 bytes) and actual
control-to-exit-inclusive round trips (max 3.23 ms across these samples). Input
latency was not measured; worker startup/deadline and SDK/DOM observations are
separate and their medians must not be added.

`mounted-soak-output.txt` is the original lifecycle-only execution's output; its
`pass:true` described its then-current lifecycle assertions and is **not** resource
acceptance. Subsequent explicit comparison of its unchanged raw samples failed
the resource gate. `mounted-soak.json` preserves the raw samples with separate
`lifecyclePass:true`, `resourcePass:false`, `pass:false` and a verdict note. The
reproduction script now applies the same growth comparison and exits nonzero on
failure. This new classification path was checked against those measured values;
the expensive resource run was not repeated merely to reproduce known growth.

Actual separate-session [window destruction](host/native-window-close.json) and
[startup shutdown](host/shutdown-result.json) also pass. They prove Electron owner
and execution cleanup, not physical window-button delivery. Before process exit,
startup worker exits and service owners/openings/retirements/senders/sweep clear;
SDK handlers are absent at process exit. The app PID is absent.

## Continuation

See [precise remaining work](NEXT.md). Another autonomous context can investigate
the reproducible installed-host resource growth and implement the remaining Host
DOM/snapshot/geometry matrix. Therefore this checkpoint is **retry**, not done.
Physical/native input and Windows/macOS remain later explicit evidence/access
gates. No original acceptance text is removed or rewritten; only the two fully
satisfied reporting/platform-marking criteria are checked in the local ticket.

## Cleanup and desktop preservation

[Cleanup](host/cleanup.json) verifies all three owned app PIDs and the private
compositor PIDs exited, owned fixture namespace was deleted, and all four private
runtime directories plus the profile/kubeconfig credentials were removed. The
helper deletes the fixture ownership file only after the UID-checked namespace
is removed, so a new context can prepare fresh fixtures.

[Continuous desktop summary](host/desktop-summary.json) and losslessly compressed
raw `*real-desktop.json.gz` record the user's active window/workspace/pointer and
client list unchanged for each interval. The successful sessions emitted 3,317
and 6,835 repeated reports of the same already-active user window; these are not
called zero events or focus changes. No workspace event or foreign test window
appeared. Pointer equality is a before/after observation; test isolation and the
absence of native input/pointer commands preserve the boundary throughout.
The two failed GPU setup intervals have zero recorded events and identical state.

[Preserved hashes](host/cleanup.json) confirm unrelated dirty glossary/docs and
runner-updated #47 remain intact. #47's Status-only update may accompany this
related commit. User extension/settings bytes match the baseline recorded before
the final host interval; no earlier before-hash claim is made for initial setup.
Raw logs/desktop streams are compressed with `gzip -n -9`; `gzip -dc` recovers
exact original evidence. No `.ralph` runtime data or credential file is committed.
