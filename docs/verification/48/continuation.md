# #48 continuation: isolated state evidence and resource diagnosis

Continuation from `b740e7d1c407162d93809c43ea65b8f4e4fb436e` on
`implementation/find`; original pre-ticket review baseline remains
`3fb33db5f5ded3523bcf66c1145f0af967ec0bf3`. Selected **Verify production Find against
the acceptance matrix**, the only ready unfinished ticket with completed local
blockers. Reclaimed using `gh issue edit 48 --add-assignee @me`. Fresh full
#36/#37/#38/#40/#48 bodies/comments equal the cached authority
([comparison](host/continuation/authority.json)). No GitHub comments or closure.

**Partial checkpoint, not done or release accepted.** Production source and package
bytes are unchanged. New `FIND_HOST_RUN` evidence subdirectories preserve the
original failed samples. Driver prototype queries now release inspector object
groups. Added installed DOM-state and minimal resource controls plus a private
heap diagnostic; its raw heaps stay in scratch and are deleted, never committed.
A private Mesa diagnostic option removes inherited NVIDIA-specific variables and
selects the AMD render node only inside the owned headless display; it failed
initialization, and is not a production fallback or a passing environment.

## Installed identity and state results

[Installed package identity](host/dom-continuation/package-identity.json):
`freelens-readable-logs@0.1.34`, stable store `freelens-readable-logs`, page/config
`readable-logs`, schema 3; Freelens 1.10.3, Electron 41.10.0, Chromium
146.0.7680.216, embedded Node 24.18.0 on Arch Linux/Wayland. The three installed
versioned CommonJS/worker asset hashes equal the checkout build. Tarball remains
`cbc903f572d5c7b8dc6dfd09e433538dda799803e8e7549f6212bb2634046825`.
[Runtime observer](host/dom-continuation/observer.json) records CWD `/home/max` and
the isolated profile. User package/configuration was not installed into or edited.

[33 passing installed DOM checks](host/dom-continuation/state-acceptance.json)
use real owned Kubernetes logs, the packed renderer, real SDK and main-owned
worker. The script waits for the full initial snapshot and Pauses before editing.

- D03: first retained result; after deselecting the reading row with current
  matching data and no active result, initial Previous selects the last match.
- D06/trace 10: partial paste, Undo/Redo refinement, select-all composition,
  composition navigation suppression, cut-to-empty and Undo crossing empty.
- D09: no-hit/one-hit count and one-hit feedback; Clear and zero-hit do not change
  scroll position after **explicit DOM scroll-event dispatch**. The private display
  does not deliver native scroll events reliably; this is a DOM-seam verdict.
- D10: both flags independently refine the settled query, retain the result after
  navigation, correctly change exact/partial matching, and restore candidates.
  History recall restores text and flags. This resolves the stable-fixture mode
  question without changing #37's contract. Earlier immediate toggles against live
  snapshots remain a confounded observation, not an alternative mode policy.
- D12: exact message Range seed, existing-query preservation, generated-label
  rejection and multi-record rejection. Full inspector/foreign/Unicode-length
  source coverage remains pending at Host, with existing pure/browser evidence.
- D11/D14/D16: Clear during async dispatch rejects obsolete results; current counts
  can finish after inspector dismissal without a selected result or reopened
  inspector; valid zero-hit Close and explicit navigation commit history.
  These checks do not hold a running worker reply: controlled mounted late
  success/failure and timeout/recovery remain pending.

No synthetic event is called native keyboard, physical selection or clipboard
coverage. No document focus was fabricated and no system clipboard was accessed.
Initial harness failures are preserved as `state-acceptance-*-initial.json`:
a quoted-selector syntax error, an empty-query wait expecting a numeric count,
undelivered native scroll, and a seed-helper variable typo. These are not passing
runs. The final script corrects its own waits/events and passes all 33 assertions;
no production change was needed.

## Resource gate remains failed

The clean-inspector run used three warmups and completed six dense-window samples
([raw measurements](host/continuation/mounted-soak-clean-inspector.json)). Clearing
console entries and releasing query handles did not remove growth: first-to-last
post-warmup +47,678 nodes, +5,252 listeners, +35,632,824 B renderer heap and
+89,260,032 B renderer RSS. The long-source part then failed waiting for highlights;
there is no completed long-bound resource verdict from this run. The original
failed mounted long-bound samples remain unchanged in the earlier report.

[Minimal controls](host/dom-continuation/retention-controls.json) remove screenshot
pumping entirely. Three samples per scenario, post-GC and console clearing:

| Scenario | Node growth, first to third | Listener growth | Resource verdict |
| --- | ---: | ---: | --- |
| Mount/load/Pause/unmount, no Find | +2,876 | +286 | Failed |
| Same plus Find query | +2,880 | +286 | Failed |
| Same plus inactive/return | +3,086 | +304 | Failed |

All controls dispose actual workers/owners; all final sender counts are zero.
These small controlled samples minimize the symptom; they are not a soak plateau.
The first control artifact's original `pass` described completion; it now preserves
that as `originalCompletionPass` and explicitly records resource failure. The
final control script itself exits nonzero on retained-object growth.

A heap captured after unmount with `exposeInternals: true` finds **13 detached
viewer sections**. [Shortest strong retaining paths](host/dom-continuation/retaining-paths.json)
run through the cluster `HTMLDocument` → `ScriptedAnimationController` → native
internal node → detached `.rl-records` → old viewer. The earlier
[control snapshot](host/continuation/controls-retaining-paths.json) shows the same
path. This identifies a native browser lifecycle queue retaining old scroll
surfaces in this stalled display. It does **not** establish that this is the only
retainer, rule out all production retention, or show that a working compositor
eliminates the growth. No unapproved product workaround was added. Raw snapshots
(including the initial 564 MiB diagnostic) are excluded and removed on cleanup.

The private NVIDIA-backed display still has a 0×0 output and GBM allocation
failures. A fresh Mesa-only attempt removed inherited `GBM_BACKEND=nvidia-drm`,
`__GLX_VENDOR_LIBRARY_NAME=nvidia` and `LIBVA_DRIVER_NAME=nvidia`, selected Mesa EGL
and `/dev/dri/renderD128` for headless labwc. It allocated 1920×1080 linear buffers
but never reached Hyprland IPC ([internal log](host/mesa-clean/hyprland-internal.log.gz),
[desktop observation](host/mesa-clean/real-desktop.json.gz)); its processes exited.
Natural frame cadence, long-source mounted resource acceptance and native input
latency remain unavailable in that environment. The successful DOM run uses the
old private display and no screenshot pump; it establishes logical DOM boundaries,
not natural native presentation or physical input performance.

## Commands and verification

All Node commands used the documented project-local toolchain:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
node --version # v24.18.0
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js --version # 11.16.0
export FIND_HOST_TICKET=48
export FIND_HOST_RUN=continuation
# Fresh profile and private display; each long-lived command supervised separately.
python3 scripts/find-production-host/prepare.py
python3 scripts/find-production-host/display.py
python3 scripts/find-production-host/launch.py
node scripts/find-production-host/install.mjs
node scripts/find-production-host/cdp.mjs 9242 main scripts/find-production-host/observer.cjs
node scripts/find-production-host/open-view.mjs
python3 scripts/find-production-host/fixtures.py
FIND_SOAK_INSPECTOR_CLEAN=1 node scripts/find-production-host/mounted-soak.mjs
# Fresh owned app for minimal controls; preserve profile/installed package.
node scripts/find-production-host/retention-controls.mjs
# Stop owned app/display; attempt separate Mesa display, which fails readiness.
FIND_HOST_RUN=mesa-clean FIND_DISPLAY_RENDERER=mesa python3 scripts/find-production-host/display.py
# Fresh original private display, same isolated installed package and owned fixture.
export FIND_HOST_RUN=dom-continuation
python3 scripts/find-production-host/display.py
python3 scripts/find-production-host/launch.py
node scripts/find-production-host/cdp.mjs 9242 main scripts/find-production-host/observer.cjs
node scripts/find-production-host/open-view.mjs
node scripts/find-production-host/state-acceptance.mjs
node scripts/find-production-host/retention-controls.mjs # expected resource failure
node --max-old-space-size=3072 scripts/find-production-host/heap-retainers.mjs
```

Reproduction requires stopping each owned app/display before the next display
starts; these lines are an ordered command inventory, not one shell batch.
The `dom-continuation`/`mesa-clean` fixture metadata copies identify the same owned
namespace created in `continuation`; they do not create or claim shared fixtures.
Keep `FREELENS_UI_MODE` unset. The final typecheck, 246 tests, six UI guards,
production browser, built workers, resource smoke, package/check and two-build
hash logs are under [dom-continuation](host/dom-continuation/). Resource smoke
stand-ins do not supersede the failed installed-host resource gate. Commands:

```sh
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
sha256sum --check docs/verification/48/host/dom-continuation/package-sha256.txt
```

## Remaining work and preservation

The [updated continuation handoff](NEXT.md) keeps all unperformed host
snapshot/profile/restart, held-completion, geometry/following and resource gates.
Physical input/selection/system clipboard/native editing/IME/AltGraph/menus/focus
and physical window delivery, plus Windows/macOS matching/worker/package and
native checks, remain **unverified**. DOM events and Linux stand-ins cannot satisfy
them. The original acceptance text and its two satisfied reporting checkboxes
remain intact; no additional whole criterion is checked by these partial results.

[Cleanup](host/dom-continuation/cleanup.json) confirms all three owned app PIDs
and all processes pointing at the owned profile/runtimes are absent, the namespace
is deleted, three private runtimes/profile credentials and raw heap snapshots are
removed, and the recorded dirty/user-config hashes are preserved. Hashes were
captured during this continuation, so no pre-setup hash comparison is claimed.
[Desktop summary](host/dom-continuation/desktop-summary.json) has no workspace
events, unchanged client lists and unchanged active window/pointer endpoints.
The two successful intervals include 4,624 and 5,369 repeated notifications of the
same already-active window; these are not claimed as zero events. Pointer equality
is an endpoint observation; no native/pointer commands touched the real desktop.
Lossless `gzip` logs/desktop streams retain original bytes. No .ralph runtime data,
unrelated dirty files, raw heaps or credentials enter the commit.

[Independent Standards and Spec review](review-continuation.md) found no hard
standards violations or remaining actionable Spec defect. Stale trace rows were
updated, and dedicated row-zero Host coverage is explicitly pending; the upstream
fixture's first matching row is 2. No failed/unperformed gate was checked off.
