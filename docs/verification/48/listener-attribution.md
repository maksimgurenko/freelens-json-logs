# #48 continuation: resource verdicts and host retention attribution

Continuation/review baseline: `a098a2105e3223fd435dbb7eef3b09c05ffd93b1`.
Original ticket pin: `3fb33db5f5ded3523bcf66c1145f0af967ec0bf3`.
Selected **Verify production Find against the acceptance matrix**, the lowest
ready ticket with completed local dependencies, and reclaimed it with
`gh issue edit 48 --add-assignee @me` before implementation.
[Full live body/comment comparison](host/listener-attribution/authority.json)
confirms #36/#37/#38/#40/#48 still match cached authority. The accepted plan is
byte-identical to the accepted `d02b7e7` artifact.

This is a partial #48 checkpoint. The resource gate remains failed, and native,
stock-display, full remaining Host and platform gates remain open. No unfinished
original acceptance criterion is newly checked. No GitHub comment/closure, push,
PR, merge or release was performed.

## Verification defect and correction

The existing installed soak compared only its **last** sample with the warm
baseline. The fresh baseline reports `pass: true` and exits zero, with +8 dense
listeners at its endpoint. Its intervening samples reach **+9**, violating the
unchanged +8 limit. The endpoint verdict is a **false pass**, not resource
acceptance. Original measurements/stdout are preserved in
[baseline-soak.json.gz](host/listener-attribution/baseline-soak.json.gz) and
[the original command output](host/listener-attribution/baseline-soak-output.txt).
Earlier reports' endpoint passes likewise do not establish an all-sample pass.

At the existing resource-report boundary, the independent
[policy audit](host/listener-attribution/check-soak-peaks.py) fails on this known
false pass ([red](host/listener-attribution/peak-verdict-red-output.txt)). The
installed soak now reports every measured sample's growth, per-metric peaks and
specific violations. It enforces the existing node/listener/heap limits and zero
allowed document growth at **every** sample. Settings equality remains checked
throughout. No threshold is raised and no sample is discarded or averaged away.

The corrected live run fails explicitly: long-source cycle 24 retains **+1,543
nodes/+26 listeners**; later samples also exceed the listener limit. The
[independent audit passes](host/listener-attribution/peak-verdict-green-output.txt)
because the new report correctly says the resource gate failed. This is green
verification of truthful reporting, **not** a green installed resource gate.
[Corrected raw samples](host/listener-attribution/corrected-soak.json.gz) retain
all failures. Production source and package bytes are unchanged.

## Listener attribution

The optional diagnostic captures attached Document/Window listener types,
target tag/classes and handler script locations in root and cluster contexts.
It disables frame piercing to avoid counting the cluster subtree twice, releases
all inspector handles and disables its Debugger domain on completion. The first
exploratory piercing census was discarded and documented in
[its sanitized summary](host/listener-attribution/listener-probe-summary.json).

Eight heap captures at initial/extreme/final samples retain only sanitized native
EventListener IDs and shortest non-weak root paths. Raw private heaps are written
with mode 0600 to scratch and removed in `finally`. Later captures also inventory
sanitized DOM-node IDs/classes and native type counts. String values, element
attributes except classes, log text, credentials, code and raw heaps are excluded.
These are shortest paths, not dominator proofs. Heap collection can remove
transient listeners; a later heap count cannot replace an earlier failed sample.

[Initial capture summary](host/listener-attribution/resource-summary.json):

- The four dense attached censuses each have **666 listeners**, with identical
  type/target/location/count rows. All eight native heap captures have **724**
  EventListener nodes; none of the sampled listener paths contains a Find viewer.
  Between dense endpoints, 29 native IDs are replaced by 29 others. Target-class
  totals balance; new paths include 17 AbortSignal listeners and host inputs.
- A host-only route control has a transient **+31 global listeners** with no
  extension viewer mounted. Host-only inactivity has zero listener growth.
- Weak-reference tracing observes new `AbortSignal` registrations without
  wrapping callbacks or strongly retaining targets. It is capped at 8,192
  registrations per frame, fails if that cap is reached, and restores the exact
  original method at teardown. Reachable targets/callbacks do **not** prove the
  listener was never removed. Tracing affects collection/timing and is diagnostic.
- The final six-cycle no-Find source-identification run has 804 captured host
  renderer stack frames, 120 Node-internal frames and 96 unclassified frames,
  with zero classified extension frames. These are repeated frame observations,
  not 1,020 distinct handlers. Earlier traces left the same host URL frames
  unclassified; they are not retroactively relabelled.

These observations narrow the nine-listener fluctuation toward host request
activity, but **do not identify every listener present at the exact failed
sample**. Both the initial +9 failure and the corrected long-source failure stay
open. No speculative product-lifetime change or execution fallback is introduced.

## Host-only node retention

The source-identification run with Find unopened gains five
`<div class="ClusterView flex column align-center">` nodes over five intervals.
Other sampled DOM class totals balance. Some shortest paths pass through host
`NonInjectedClusterView`/MobX `ComputedValue.observers_` and React internals.

A separate **host-only** inactivity control, with no extension viewer mounted,
then gains **14 of exactly that node class** over 15 measured samples. Other
sampled DOM class totals are unchanged, and native listener totals are unchanged.
Its native paths include the host iframe/container tree. A repetition with neither
listener census nor heap capture again gains **+14 nodes**, zero listeners.
[Raw host-only samples](host/listener-details/host-only-retainers.json) and the
[uninstrumented repetition](host/listener-details/navigation-control.json) retain
both results; [sanitized low/high paths](host/listener-details/listener-heap-host-idle-14.json.gz)
identify the host class. This establishes host-side retention for this observed
per-inactivity node symptom; it does not attribute the separate listener spike or
all retained memory to that class. The pinned host is not patched.

## Actual installed workloads and limits

Same `freelens-readable-logs@0.1.34` tarball SHA-256:
`995f1cf5e3ac81f377b16cf8dea24c15237824cd31dd1a066acde26bf868f904`.
[Installed asset/runtime identity](host/listener-attribution/package-identity.json)
compares main, renderer and worker against the build. Stable package/store
`freelens-readable-logs`, page/config `readable-logs`, schema 3; Freelens 1.10.3,
Electron 41.10.0 / Node 24.18.0 / Chromium 146.0.7680.216. Host CWD `/home/max`;
process-local polling variables are `CHOKIDAR_USEPOLLING=1`, `CHOKIDAR_INTERVAL=100`.
Installation is a single form submission in a fresh private profile before any
cluster. No same-version live module replacement occurs.

All full workloads use three warmups and 30 measured cycles per workload: a
1,000-record dense source (4,800,000 application-text units) and one near-5-MiB
source (5,242,752 units, before its transport timestamp/terminator). They cover
the row bound and a near-byte-bound source; this is not an exact 5,242,880-byte
installed response fixture. Inactive waits are 100 ms and natural private-output
frames run without a screenshot pump. The no-Find control keeps Find hidden and its query empty; it
checks zero marks/highlights and is not a matching test. Its first attempt had an
incorrect harness expectation that a hidden input was absent rather than empty;
[that failure](host/listener-attribution/no-find-precondition-failed.json) is retained
and is not a product failure. Final control code reports no matching time when
matching is not performed; the earlier 30-cycle control's `matchObservedMs` only
measured the Pause action and must not be read as matching latency.

| Run | Peak dense nodes/listeners | Peak long nodes/listeners | Resource verdict |
| --- | --- | --- | --- |
| Fresh uninstrumented baseline, old endpoint calculation | +50 / +9 | +29 / 0 | **Failed**; original stdout falsely passes |
| Listener census + heap captures | +36 / +1 | +29 / 0 | Scoped instrumented pass; cannot clear failure |
| Corrected uninstrumented Find soak | +38 / +1 | +1,543 / +26 | **Failed**, correctly reported |
| Find unopened + weak abort trace | +29 / 0 | +29 / 0 | Attribution control pass |
| Find enabled + weak abort trace | +39 / +1 | +28 / 0 | Scoped instrumented pass; cannot clear failure |

[Resource summary](host/listener-attribution/resource-summary.json) records warm
baselines, last and peak growth for main/renderer heap/external/RSS, nodes,
listeners/documents, Linux threads, whole-profile disk bytes/files, settings hashes
and observed inactivity-to-actual-exit times. These are whole-host quantities;
startup, IPC, matching, DOM and native input are not conflated. Observer logs and
optional tracing affect instrumentation overhead. Short samples and the private
modified Aquamarine compositor do not establish stock-display behavior, native
input responsiveness or a long-duration resource plateau.

## Reproduce and validate

[Exact per-command records](host/listener-attribution/commands.jsonl) include
arguments, relevant environment, exit codes and elapsed time. The following uses
the existing project-local toolchain and a **new** owned run/profile/UID fixture:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PWD/.scratch/readable-logs/toolchain/node_modules/.bin:$PATH"
export FIND_HOST_TICKET=48 FIND_HOST_RUN=my-fresh-run
python3 scripts/find-production-host/prepare.py
python3 scripts/find-production-host/fixtures.py
FIND_DISPLAY_RENDERER=mesa LD_LIBRARY_PATH="$PWD/.scratch/find/48-host/aquamarine/build" python3 scripts/find-production-host/display.py
# Supervise the display and host separately; leave FREELENS_UI_MODE unset.
python3 scripts/find-production-host/launch.py
node scripts/find-production-host/install.mjs
node scripts/find-production-host/cdp.mjs 9242 main scripts/find-production-host/observer.cjs
node scripts/find-production-host/open-view.mjs
node scripts/find-production-host/identity.mjs
FIND_SOAK_INSPECTOR_CLEAN=1 FIND_SOAK_NATURAL_FRAMES=1 FIND_SOAK_CYCLES=30 FIND_SOAK_IDLE_MS=100 node scripts/find-production-host/mounted-soak.mjs
```

Optional diagnostics: `FIND_SOAK_LISTENERS=1` captures attached census at initial,
extreme and final samples; `FIND_SOAK_LISTENER_HEAPS=1` captures sanitized heap
paths. `FIND_SOAK_SIGNAL_TRACE=1` enables the temporary weak abort trace.
`FIND_SOAK_NO_FIND=1` runs the unopened-Find attribution control.
`FIND_CONTROL_SCENARIOS=host-idle node scripts/find-production-host/navigation-control.mjs`
minimizes host inactivity. Use a separate evidence run name (copy its owned
fixture descriptor) before repeating captures, so labels cannot overwrite prior
measurements. The second run name selects evidence only; the host/profile remain
those verified by the driver and recorded runtime identity.

Final pinned Node 24.18.0/npm 11.16.0 locked install, typecheck, **249 tests**, six
UI guards, mounted production browser, real built workers, original resource smoke,
strict packed checks and deterministic two-build SHA pass. The installed
uninstrumented resource failure remains a separate failed gate. The five focused
range tests passed during work. No production test seam or behavior changed.

## Ownership, desktop and remaining gates

[Shutdown](host/listener-attribution/shutdown-clean.json) observes **466 actual
worker starts/exits**, peak one, zero live workers and zero owner/opening/retiring/
sender/watch maps, including shutdown during paused startup. This is actual exit,
not inferred from a rejected promise. The SDK handler list at `will-quit` still
contains three handlers; no claim of zero SDK handlers at that instant is made.
The isolated process then exits normally.

[Cleanup](host/listener-attribution/cleanup.json) verifies the host/private display
PIDs are gone, removes only their temporary profile/runtime and deletes only the
UID-checked owned namespace. Fresh before/after hashes match for user settings,
dirty glossary and docs index. No raw private heap remains. The real-desktop
observer has 12,851 redundant notifications of the same focused kitty, **zero
observed focus-address/workspace/window transitions**, identical client lists and
pointer endpoints. Pointer equality is endpoint-only. No native input, activation,
clipboard operation, focus restoration or fake focus was sent. The test host was
verified only on its private workspace 7; no test window reached the real desktop.

Physical selection/copy/clipboard, native editing/paste/Undo/Redo/IME/AltGraph,
shortcuts/menus/focus/window delivery, stock-display/long-duration resources and
all listed Windows/macOS checks remain unverified. Full remaining Host cases stay
scoped in [the matrix](matrix.md). [NEXT.md](NEXT.md) gives the concrete continuation.
[Independent Standards and Spec review](review-listener-attribution.md) records
this continuation separately from the original ticket baseline.
