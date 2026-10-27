# #48 continuation: stable highlight feedback under dense wrapping

Continuation/review baseline: `0f39b79dc27076323a53f47f7aab209801b8022f`.
Original ticket pin: `3fb33db5f5ded3523bcf66c1145f0af967ec0bf3`.
Selected **Verify production Find against the acceptance matrix**, the lowest
ready ticket with completed local dependencies, and reclaimed it using
`gh issue edit 48 --add-assignee @me` before changing code.
[Fresh live full-body/comment comparison](host/dense-cadence/authority.json)
confirms #36/#37/#38/#40/#48 match the cached sources. The accepted plan is
byte-identical to `d02b7e7c19c8e48b1cde714f0a23813b40374824`.

This is a partial implementation/verification checkpoint, not full #48 or release
acceptance. Original acceptance text and unfinished checkboxes are preserved.
There was no issue comment/closure, push, PR, merge or release.

## Reproduction and cause

`dense-cadence.mjs` replaces the slow historical replay with three controls on
one actual installed 1,000-record/~4.8 MB window: no query, a zero-hit query,
and query `a`, then three current grouped-mark activations. It collects natural
frames, layout/script metrics, clip heights and status transitions. Its 12-frame/
3-second guard diagnoses scheduling; it is not a product/native latency bound.

[First wrapped failure](host/dense-cadence/dense-cadence-wrap-first.json):
no query and zero-hit each deliver 12 frames in ~200 ms. Dense matching delivers
only 11 in 3.59 seconds (caller ~4 seconds). The
[instrumented repetition](host/dense-cadence/dense-cadence-wrap-baseline.json)
reproduces 27 layouts, ~1.56 seconds layout and ~1.30 seconds script time. Feedback
repeatedly disappears/reappears while the scroller alternates **383/412 px**.
[Unwrapped control](host/dense-cadence/dense-cadence-nowrap.json) passes.

Three ranked hypotheses were recorded before instrumenting: status-driven clip
changes, repeated highlight projection, and repeated row rendering. Changing
only Find-bar geometry in the diagnostic host makes the dense sample deliver
12 frames in ~168 ms ([fixed-size control](host/dense-cadence/dense-cadence-wrap-fixed-feedback.json)).
This isolates a feedback loop: a larger clip exceeds the DOM cap, displaying
incomplete feedback; that feedback shrinks the clip below the cap, so completion
removes it and exposes more text again. The earlier slow profiler remains valid
historical evidence of that workload, not exclusive attribution to a function.

## Production fix and regression

Keep a stable, responsive footprint for the existing highlight-status area while
Find is open. The invisible CSS reserve uses the same incomplete-status string
as the real feedback; pending feedback is shorter than that reserve at narrow
widths. Only the actual message is live/accessibility text; the
reserve is hidden generated content outside log sources. It wraps with the bar
rather than using a fixed height or clipping feedback. Empty Find reserves the
same space, so later matching completion cannot introduce a new region after
inspection dismissal. Toolbar and Find stay separate; the black canvas, no
counters, source nodes, copy strings and matching/worker contracts are unchanged.
No matching fallback, timing budget, retention or acquisition change.

The public mounted-production-renderer regression positions match **1025** just
inside the clip, then observes 12 frames after initial layout. It checks stable
clip geometry, all 1,000 exact matching records, and nonzero highlights within
1,024. [Targeted red on pristine baseline production files](host/dense-cadence/browser-red-boundary.txt)
records **301,325,301,325,...**. The exact final test passes with the fix
([final green](host/feedback-final/browser.txt));
[focused range-controller tests](host/dense-cadence/ranges-focused.txt) also pass.

Intermediate evidence is retained separately:

- `browser-red.txt` catches an early clip transition; its fixed wait was too early.
- `browser-green.txt` still catches that transition, so it is not a passing run.
- `browser-green-adjusted.txt` fails a clipping-fixture assertion.
- `browser-clip-diagnostic.txt` catches a real dismissed-origin scroll regression
  in the intermediate version that reserved space only after exact completion.
  Reserving it for the lifetime of the open Find bar fixes that regression too.
- `browser-red-final.txt` fails a separate seeded-mark ordinal check, so it is
  **not** the targeted red proof. The boundary-positioned red above is the proof.
- `browser-green-fixed.txt` passes the complete suite before the final boundary
  refinement; the final full-browser check below is the current regression.

## Intermediate installed packages

The initial long-reserve package, installed in a fresh process/profile through
the real form before any cluster, was:
`freelens-readable-logs@0.1.34`, tarball SHA-256
`8b7075c6675a54268d6afa6209926c06be52f98c506af89a96b2734de39e2731`.
[Installed identity](host/dense-fixed/package-identity.json) verifies the main,
renderer and trusted worker against the build, pinned Freelens 1.10.3, stable
package/store `freelens-readable-logs`, page/config `readable-logs`, schema 3.
Electron 41.10.0 / embedded Node 24.18.0 / Chromium 146.0.7680.216; build/driver
Node 24.18.0 / npm 11.16.0. Host CWD `/home/max`; polling variables
`CHOKIDAR_USEPOLLING=1`, `CHOKIDAR_INTERVAL=100`.

The private labwc → Hyprland workspace 7 reuses the documented diagnostic
Aquamarine build from [cadence.md](cadence.md). It has a real 1280×720 output and
natural frames, but remains a modified compositor. `FREELENS_UI_MODE` is unset,
`document.hasFocus()` is false, and no native input, focus change, pointer move,
clipboard read/write or user-window maintenance is performed.

[Installed dense check](host/dense-fixed/dense-cadence-wrap-baseline.json) passes:
12 frames in **194.8 ms**, only two layouts (~0.95 ms total), stable **383 px**
clip, exact 1,000 records and **984** visible native ranges. Three mark activations
address records 0/1/2 without inspection. Caller elapsed for the frame sample is
~392 ms and includes scheduling around the measurement; mark observations are
~65/136/237 ms. These small diagnostic samples are not native latency acceptance
or a worst-case responsiveness claim. Actual worker start/exit is observed at
teardown, with zero owners/senders/watch/replacement maps remaining.

The first long-reserve package **fails** the actual width-260 source/geometry
check after 82 assertions ([failure](host/dense-fixed/surfaces-narrow-failure.json)):
the large reserved sentence leaves no usable log height. The subsequent compact
message `Highlighting incomplete.` fixes that; the same 192-assertion suite passes
in `compact-final`. Pending feedback is also compact (`Highlighting pending.`)
in the final artifact, so it cannot wrap taller than the reserve. Exact counts
and enabled navigation remain separate from this feedback.

`browser-green-compact.txt` fails the later viewport/inspector sharing check:
the added dense/narrow fixture had displaced that check's prior bottom-positioned
fixture. Restoring its original data and bottom position fixes the isolation
error (`browser-green-restored-fixture.txt`). No sharing assertion was removed.

## Final artifact and installed checks

**Final package:** `freelens-readable-logs@0.1.34`, SHA-256
`995f1cf5e3ac81f377b16cf8dea24c15237824cd31dd1a066acde26bf868f904`.
[Final identity](host/feedback-final/package-identity.json) compares all three
installed versioned assets with the final build and records the runtime/toolchain
and unchanged schema/stable identifiers described above. This is a fourth fresh
isolated process/profile, installed before any cluster; it does not overwrite a
same-version module in a running process. Its fixture namespace has fresh UIDs.

[Exact final host commands](host/feedback-final/host-commands.json) retain the
command, relevant environment, exit code and elapsed time for each check:

- [Dense natural cadence](host/feedback-final/dense-cadence-wrap-baseline.json):
  no-query/zero-hit/dense controls, stable clip, all 1,000 records, native source
  ranges within the cap, first three mark members, and actual teardown/exit.
- [33 state assertions](host/feedback-final/state-acceptance.json),
  [13 held SDK-delivery assertions](host/feedback-final/held-replies.json),
  [20 terminal-Q observations](host/feedback-final/long-source.json) and
  [192 source/geometry assertions](host/feedback-final/surfaces.json), including
  260/390/700/1440 CSS-pixel widths, inspector layouts, fonts, source seed limits,
  DOM selection and black/no-counter/separate-bar appearance.
- [Real Disable/Uninstall/reinstall](host/feedback-final/extension-lifecycle.json)
  covers paused startup and idle reuse, actual exit, removed SDK handlers and
  reactivation in a fresh main window before a cluster. Renderer event probes
  are not native menu/input proof.
- [Actual append/following/Pause](host/feedback-final/marks-following.json),
  [SDK/frame ownership](host/feedback-final/sdk-suite.json),
  [startup-inclusive timeout](host/feedback-final/startup-timeout.json),
  [20 latest-only bursts](host/feedback-final/actual-host-churn.json) and
  [startup shutdown](host/feedback-final/shutdown-clean.json) repeat on this
  final artifact. Actual exits and zero owner/replacement/sender/watch maps are
  recorded, rather than inferred from rejected requests.

The Linux/Core/Browser passes do not turn historical Host cases into new-package
runs. In particular, full current-package snapshot/profile/restart/duplicate and
stale target/viewer counterparts remain separate from the repeated subset above.
The [matrix](matrix.md) keeps those scopes and all native/platform limits visible.

## Resource evidence and attribution limits

The soak now accepts 6–120 measured cycles and 0–1000 ms inactive waits (defaults
remain six/zero). It records post-GC main/renderer heap, external/RSS, DOM,
listeners/documents, main/renderer threads, isolated profile file sizes and exact
extension-settings hashes, as well as time until actual inactive worker exit.
No thresholds are relaxed. The workload uses three warmups and **30 measured
cycles per bound**, with **100 ms** inactive waits and natural frames, no screenshots.

The first long-reserve package's [114-second run](host/dense-fixed/resource-summary.json)
passes lifecycle/actual exit/settings, but **fails +9 dense listeners against +8**.
Dense last growth: +51 nodes, +2,366,720 B heap, +16,650,240 B RSS. Long:
+39 nodes, +5 listeners, +839,660 B heap. This failure is retained and unresolved.
An independent [shortest-strong-path capture](host/dense-fixed/retaining-paths.json)
finds zero detached viewer sections; that does not rule out other retained objects.
Raw private heaps are removed by the diagnostic.

The intermediate compact package's [114-second comparison](host/compact-final/resource-summary.json)
passes the existing retained-object limits: dense +29 nodes/0 listeners/+1,550,484 B
heap; long +28/0/+75,392 B. Settings are unchanged. Disk growth is +11,487 B in
host profile files per bound; main/renderer threads change by 0/+2 and +1/0,
respectively. These are observed whole-host quantities, not extension thread or
disk attribution, nor a long RAM/disk plateau. The earlier failure stays open.

[Navigation controls](host/compact-final/navigation-control.json.gz) compare 15 cycles
each after three warmups in that used host: stationary, host route changes,
viewer without Find and viewer with Find retain 0/0/0/-1 nodes respectively;
**viewer with Find plus root/cluster inactivity retains +14 nodes**. All five have
zero listener growth. This isolates a smaller *node* symptom, without explaining
the failed listener step. It is not a fresh-process control or an acceptance pass.
A concrete next investigation is adding viewer-inactivity-without-Find and
host-only root/cluster inactivity controls, then comparing sanitized retaining
paths for the single-node-per-cycle growth. Do not infer a leak cause or change
production lifetime contracts before that comparison.

The [final 114-second soak](host/feedback-final/resource-summary.json) again
**fails +9 dense listeners against +8**, with +51 nodes, +1,862,708 B heap and
+10,207,232 B RSS. Long last growth is +19 nodes/-1 listener/+376,312 B heap;
its peak listener growth is zero. Both bounds keep four documents and exact
settings hashes. Dense/long profile growth is +11,210/+11,338 B in host files;
main threads change +1/0, renderer threads 0/0. These are sampled host quantities,
not an attribution to Find. Maximum observed inactivity-to-actual-exit is
~102.75 ms dense / ~20.55 ms long; it includes navigation/IPC/observation overhead.
Actual startup/exit counters finish **219/219**, peak one, with zero service maps
at app shutdown. This remains failed resource evidence despite passing lifecycle.

[Final control repetition](host/feedback-final/navigation-control.json.gz) retains
0/-2/+9/-9/+5 nodes across stationary/host-route/viewer-no-Find/viewer-Find/
viewer-Find-idle, with listener deltas 0/0/+1/-1/-1. Thus the earlier +14-node
inactivity signal is not yet a deterministic single-node leak proof. The two
controls together suggest transient host objects as a competing explanation;
they do not explain or clear the reproducible +9 soak failure. Next capture
listener types/targets and sanitized retaining paths at the exact low/high
post-GC samples, adding inactivity-without-Find and host-only visibility controls.
Do not adjust the +8 threshold or change production lifetime from these counts.

## Final automated verification and limits

[All final commands](host/feedback-final/checks.json) pass with project-local
Node 24.18.0/npm 11.16.0: locked `ci --ignore-scripts --no-audit --no-fund`,
typecheck, **249 tests**, six UI guards, mounted production Chromium, actual built
workers, original resource smoke, packaging and strict packed checks. The
[two-build comparison](host/feedback-final/reproducibility.json) has identical
SHA-256 above. Strict worker/assets/host-global/dependency allowlists remain intact.
Focused range tests were run during implementation, not added as mirrored tests.

Physical selection/copy/system clipboard, native editing/paste/Undo/Redo/IME/
AltGraph/modifiers/menus/focus/window delivery and every listed Windows/macOS
check remain **unverified**. The private diagnostic compositor cannot establish
stock-display acceptance. Short runs and the passing headless smoke cannot clear
the retained installed resource failure or establish long-duration plateau.
No whole unfinished original criterion is newly checked; only the already
satisfied explicit platform marking and honest evidence reporting remain checked.

## Reproduction

Use fresh owned profiles/UID-checked fixtures, never historical PIDs or UIDs:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PWD/.scratch/readable-logs/toolchain/node_modules/.bin:$PATH"
export FIND_HOST_TICKET=48 FIND_HOST_RUN=my-fresh-run
python3 scripts/find-production-host/prepare.py
python3 scripts/find-production-host/fixtures.py
python3 scripts/find-production-host/surface-fixture.py
# Supervise display and host as separate long-lived processes, with UI mode unset.
FIND_DISPLAY_RENDERER=mesa LD_LIBRARY_PATH="$PWD/.scratch/find/48-host/aquamarine/build" python3 scripts/find-production-host/display.py
python3 scripts/find-production-host/launch.py
node scripts/find-production-host/install.mjs
node scripts/find-production-host/cdp.mjs 9242 main scripts/find-production-host/observer.cjs
node scripts/find-production-host/lifecycle.mjs
node scripts/find-production-host/open-view.mjs
node scripts/find-production-host/identity.mjs
node scripts/find-production-host/dense-cadence.mjs
node scripts/find-production-host/state-acceptance.mjs
node scripts/find-production-host/held-replies.mjs
node scripts/find-production-host/long-source.mjs
node scripts/find-production-host/surfaces.mjs
FIND_SOAK_INSPECTOR_CLEAN=1 FIND_SOAK_NATURAL_FRAMES=1 FIND_SOAK_CYCLES=30 FIND_SOAK_IDLE_MS=100 node scripts/find-production-host/mounted-soak.mjs
node scripts/find-production-host/navigation-control.mjs
FIND_HOST_SCENARIO=following node scripts/find-production-host/marks-following.mjs
node scripts/find-production-host/suite.mjs
node scripts/find-production-host/timeout.mjs
node scripts/find-production-host/churn.mjs
node scripts/find-production-host/shutdown.mjs
```

Following appends to `find-surfaces`; later surface reruns require a new owned
fixture. Read [NEXT.md](NEXT.md) for remaining gates. Raw commands/results are
retained per run; earlier packages are not relabelled as the final artifact.

## Cleanup and review

[Cleanup](host/feedback-final/cleanup.json) verifies all four owned hosts are gone,
removes their four temporary profiles (including credentials) and the one private
display runtime, and records UID-checked deletion of both owned fixture namespaces.
No shared fixtures, user installation/settings or unrelated scratch/build resources
are removed. The dirty glossary/docs-index hashes match the fresh baseline. User
settings match the prior checkpoint hash; that comparison is explicitly historical,
not described as a newly captured before-run snapshot.

[Real desktop observation](host/dense-cadence/real-desktop.json.gz) has identical
before/after clients, workspace 2, focused kitty and pointer endpoints. Its 18,643
events are redundant `activewindowv2` notifications of that same kitty address;
there are no observed focus-address/workspace/window transitions. Pointer positions
were not continuously sampled, so endpoint equality is not presented as proof of
an unchanged pointer throughout. No native pointer/focus/clipboard operations or
focus restoration were sent. Every test host was verified on its separate
workspace 7. No test window reached the observed user client list.

[Independent Standards and Spec reviews](review-dense-cadence.md) use the recorded
continuation baseline and scoped uncommitted diff, with original authority supplied
before conclusions. No actionable production issue remains. One optional repeated
host-control helper smell is documented; no unrelated refactor was added. The
resource and absent native/platform evidence remain unfinished acceptance gates.
