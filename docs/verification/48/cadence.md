# #48 continuation: natural frames and clipping-safe highlights

Continued on `implementation/find` from `d235606ddada690f08ec02e346d93f48ca94ecfe`.
The original ticket/review fixed point remains
`3fb33db5f5ded3523bcf66c1145f0af967ec0bf3`. Reclaimed **Verify production Find
against the acceptance matrix** with `gh issue edit 48 --add-assignee @me`.
[Fresh authority comparison](host/cadence/authority.json) confirms the complete
live #36/#37/#38/#40/#48 bodies and comments equal the cached authority.
No GitHub comment, closure, push, PR, merge or release.

**Partial checkpoint.** The production renderer fix below is verified separately
from the private compositor diagnostic. No original full acceptance criterion is
newly checked. Previous failed and unperformed gates remain visible.

## Two independently identified problems

The stock Mesa-only private display again failed IPC readiness. Explicit monitor
configuration did not repair it. A parent debugger (direct attach was denied by
Yama) found Hyprland in its normal event loop. Wayland tracing showed the initial
output-surface commit had not been flushed to labwc. A diagnostic one-line flush
in a **private** Aquamarine v0.15.1 build lets the existing Hyprland start with a
1280×720, 60 Hz output on its own workspace 7. This modifies neither installed
system libraries nor Freelens, its ASAR, SDK, CSP or package. It is a diagnostic
environment, not evidence that the stock nested compositor now works.

- Stock failures: [Mesa](host/cadence/real-desktop.json.gz),
  [explicit monitor](host/explicit-output/real-desktop.json.gz).
- [Debugger log](host/mesa-debugger/hyprland.log.gz),
  [protocol trace](host/wayland-trace/hyprland.log.gz), and
  [private patch](host/cadence/private-aquamarine.patch.gz).
- Aquamarine source commit `f31c47a1b9d300847d8fc3108ad959448103dfc1`;
  [build packages](host/cadence/build-packages.json) were SHA-256 verified against
  local Arch sync metadata and extracted only under the owned scratch prefix.
  [Build log](host/cadence/aquamarine-build.txt) and
  [loaded-library/package identity](host/private-flush/package-identity.json).
- [Natural cadence](host/private-flush/frame-cadence.json): 61 actual rAF
  callbacks without screenshots in about one second; document focus remains false.
  No physical input, native latency or clipboard claim. An upstream
  [nested-frame issue](https://github.com/hyprwm/aquamarine/issues/348), opened
  2026-08-01, describes related symptoms, but is not proof of this cause.

With natural frames, the previous minimal retained-view symptom disappears:
[three-cycle controls](host/private-flush/retention-controls.json) grow 0 nodes /
0 listeners for mount and Find, and 2 nodes / 0 listeners for inactivity. Earlier
native-queue retaining paths remain historical failures; this controlled comparison
supports environment-dependent retention, not a claim to rule out every leak.

A second, actual production Find defect remained. A one-record ~5 MiB source
ending in ` Q` counts correctly, but its visible `Q` receives no highlight.
[Focused installed red check](host/sparse-terminal/long-source.json) observes
20 visible, undecorated samples. [SDK/geometry trace](host/sparse-trace/sdk-range-trace.json)
shows local highlight feedback changing the clipping scroller's height while the
viewer root and source remain unchanged. The initial observer-only correction
exposes a self-induced pending/resize/cancel loop
([intermediate failure](host/fixed/long-source.json)). Coverage reuse without
redrawing then leaves the newly visible text undecorated
([intermediate projection failure](host/settled/long-source.json)). These failed
attempts are retained, not counted as passes.

The final production change:

- Observe source clipping ancestors as well as source/root dimensions, using the
  same ancestor definition that computes visible interest. Existing disconnect /
  disposal removes these observations too.
- Keep a still-current pending attempt when its requested spans cover a smaller
  visible interest. Keep completed **complete** coverage for a contained interest;
  incomplete replies must still allow a new narrower request for late-source hits.
  Preserve the original attempt's deadline, current key and presentation identity.
- Redraw reused ranges against newly measured visible spans even when no SDK
  reply is needed. Exact membership, matching, counts, source text and copy stay
  unchanged. No fallback, host/CSP patch or new UI band.

TDD used the already-authorized range-controller/SDK and mounted production
renderer seams. [Unit red](host/cadence/ranges-red.txt.gz) shows shrinking the clip
incorrectly discarding a covering reply; [focused final tests](host/cadence/ranges-final.txt)
pass pending coverage reuse and late interest after incomplete coverage. The
independent Spec review also reproduced a narrower interest lost during a pending
broad request; [the added red regression](host/cadence/review-race-red.txt.gz) and
[green result](host/cadence/review-race-green.txt) retain that ordering. The controller
now remembers only the newest covered interest and requests it after an incomplete
reply, without waiting for a new layout event or renewing the running deadline. The
additional browser check grows only a clipping surface while retaining root/source
height and scroll position; it passes before and after the fix and is not claimed
as the red regression. An initial browser fixture precondition failure and its
correction are retained under `host/cadence/browser-red*.txt`.

[Final installed check](host/review-final/long-source.json) passes: all 20 samples
show the correct exact count, visible terminal `Q`, its Custom Highlight and no
pending/incomplete feedback. The final package is installed once through the real
Extensions form in a fresh isolated profile/window, before opening any cluster.
Earlier package/profile runs are separate evidence and are not relabelled as the
final artifact. Main/worker/renderer asset hashes are checked against the build.

## Resource and regression evidence

[Diagnostic long dense-source resource run](host/natural-dense-source/mounted-soak-clean-inspector.json)
uses the old package, query `x` in the long source, three warmups and six measured
cycles per bound. Dense retained growth: +15 nodes, +1 listener, +292,060 B heap;
long: +5 nodes, -4 listeners, +388,096 B heap. Actual owners/senders/workers are
released on every teardown. This query variation measured resources while the
sparse-Q rendering gate was still failed; it did not substitute for that gate.
The final harness retains the original `Q` workload, explicitly uses To bottom
after wrap settles, and drains two natural frames before post-unmount GC.

Final package: `freelens-readable-logs@0.1.34`, stable store/name
`freelens-readable-logs`, page/config `readable-logs`, schema 3, Freelens 1.10.3.
[Exact installed asset and private environment identity](host/review-final/package-identity.json)
matches the build; Electron 41.10.0 / embedded Node 24.18.0 / Chromium
146.0.7680.216, Arch Linux/Wayland, host CWD `/home/max`.
Tarball SHA-256: `1775d0f0aaa1d23002bf723d68c6840fa44d2c6bd3c5536e72bbc05546f0fdf1`.
[Two-build reproducibility](host/cadence/reproducibility.json) passes.

- [Final command results](host/cadence/checks.json): typecheck, **249/249** tests,
  six desktop policy checks, real mounted production Chromium, built workers,
  resource smoke, strict package checks and reproducible packaging all pass.
- [Current installed DOM state](host/review-final/state-acceptance.json): **33**
  checks pass with natural frames, no screenshot pump. DOM input/selection remains
  explicitly distinct from native/physical/clipboard evidence.
- [Current mounted resources](host/review-final/mounted-soak-clean-inspector.json):
  three warmups and six measured cycles per bound, original queries `a` / `Q`,
  actual active/inactive/unmount/worker exit. Dense growth: **+5 nodes / 0 listeners /
  +1,013,540 B heap / -8,261,632 B RSS**; long: **+5 / 0 / +216,832 B / +487,424 B**.
  All thresholds pass and the terminal-Q ranges are at the end of the source.
  Two natural frames drain native lifecycle queues before post-unmount GC.
- [Current SDK/frame suite](host/review-final/sdk-suite.json) passes root/cluster
  isolation, four modes, retention/range cap, inactivity, same-frame replacement
  and actual frame removal. Final actual worker starts/exits **34/34**, peak one,
  zero owners/senders/opening/retirement maps or sweep. This repeats the current
  package subset; earlier disable/uninstall/shutdown coverage remains scoped to
  its recorded packages.

Failures above remain separate. Short samples do not establish a long-duration
memory plateau, exhaustive disk behavior or native input responsiveness. The
compositor remains a modified diagnostic environment; stock-output and full
resource acceptance remain open. No whole resource criterion is checked off.

## Reproduction

Keep `FREELENS_UI_MODE` unset. Run from this checkout with the documented toolchain:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
node --version # v24.18.0
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js --version # 11.16.0
export FIND_HOST_TICKET=48
export FIND_HOST_RUN=projection
python3 scripts/find-production-host/prepare.py
# A fresh owned fixture, or retain the exact still-owned UID-checked fixture.
python3 scripts/find-production-host/fixtures.py
```

The diagnostic build requires the three checksum-verified packages in
`host/cadence/build-packages.json`, extracted into `.scratch/find/48-host/prefix/`.
No global package install is performed. The first cmake invocation failed because
cmake was absent, then its private binary lacked rhash/cppdap; the retained package
inventory includes those prerequisites. Build the exact private source/patch:

```sh
git clone --depth 1 --branch v0.15.1 https://github.com/hyprwm/aquamarine.git .scratch/find/48-host/aquamarine
gzip -dc docs/verification/48/host/cadence/private-aquamarine.patch.gz | git -C .scratch/find/48-host/aquamarine apply -
LD_LIBRARY_PATH="$PWD/.scratch/find/48-host/prefix/usr/lib" .scratch/find/48-host/prefix/usr/bin/cmake -S .scratch/find/48-host/aquamarine -B .scratch/find/48-host/aquamarine/build -DCMAKE_BUILD_TYPE=Release -DBUILD_TESTING=OFF
LD_LIBRARY_PATH="$PWD/.scratch/find/48-host/prefix/usr/lib" .scratch/find/48-host/prefix/usr/bin/cmake --build .scratch/find/48-host/aquamarine/build --target aquamarine -j 4
# Supervise display and host as separate long-lived commands.
FIND_DISPLAY_RENDERER=mesa LD_LIBRARY_PATH="$PWD/.scratch/find/48-host/aquamarine/build" python3 scripts/find-production-host/display.py
python3 scripts/find-production-host/launch.py
node scripts/find-production-host/install.mjs
node scripts/find-production-host/cdp.mjs 9242 main scripts/find-production-host/observer.cjs
node scripts/find-production-host/open-view.mjs
node scripts/find-production-host/frame-cadence.mjs
node scripts/find-production-host/long-source.mjs
node scripts/find-production-host/state-acceptance.mjs
FIND_SOAK_INSPECTOR_CLEAN=1 FIND_SOAK_NATURAL_FRAMES=1 node scripts/find-production-host/mounted-soak.mjs
node scripts/find-production-host/suite.mjs
```

Run the usual pinned typecheck, full tests, six UI policy checks, `test:browser`,
`test:workers`, `test:smoke`, `package`, `check:package`, then a second package build
and SHA-256 comparison. Exact executed commands/exit codes are in `checks.json`.
Earlier full checks, before the last projection update, are under
`host/cadence/pre-projection/` and do not supersede the final run.

## Remaining gates

Continue only #48. Complete the remaining actual snapshot/profile/repeated-restart,
held current/stale completion/failure, inspector selection and measured geometry /
following matrix in [NEXT.md](NEXT.md). The final renderer changes also require
rechecking relevant earlier package-specific host cells; do not carry older package
passes forward automatically. Native physical input/clipboard/editing/IME/AltGraph,
modifiers, menus/focus/window delivery and Windows/macOS remain **unverified**.
No unattended native input or clipboard operation was used. Separate-session DOM
and natural frames do not satisfy physical/platform gates.

## Cleanup and desktop observation

[Final cleanup](host/review-final/cleanup.json), with [earlier cleanup](host/projection/cleanup.json), verifies zero remaining processes using
any owned profile/runtime, removal of five private profiles (including their
credential copies), six private runtimes and the UID-checked fixture namespace.
The private source/build/package cache is retained in scratch for reproducibility;
no raw heaps, profile credentials or .ralph runtime enter the commit. The dirty
Glossary and docs index, plus the user's extension configuration, retain their
recorded pre-continuation SHA-256 hashes.

[Continuous desktop summaries](host/projection/desktop-summary.json) and
[final interval](host/review-final/desktop-summary.json) has unchanged
focus/workspace/client lists and pointer endpoints. Four failed startup intervals
have zero events. The successful long interval includes **15,975 notifications of
the same already-active window**, and the final interval has another **2,397**
identical notifications, with zero workspace or client open/close events.
It is not described as zero events or proven physical-input continuity. All
commands that mutate a compositor targeted only the private runtime/socket; no
native input, window focus/activation/restoration, pointer or clipboard commands
operated the user's desktop. Lossless gzip files retain the full original logs
and event stream. [Independent Standards and Spec review](review-cadence.md) has zero remaining
actionable findings after the pending/incomplete race correction.
