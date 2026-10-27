# #48 continuation: source eligibility and measured mark cycling

Continuation/review baseline: `f8d7643e8d6cda3abac8ee4769403d49b0278818`.
Claimed **Verify production Find against the acceptance matrix** with
`gh issue edit 48 --add-assignee @me`. [Live full authority](host/geometry/authority.json)
matches the cached #36/#37/#38/#40/#48 bodies and all comments. Only #48 is in scope;
no issue comment/closure, push, PR, merge or release is performed.

This remains a partial checkpoint. Original acceptance criteria are preserved;
no whole unfinished criterion is newly checked. Native/platform and remaining
host/resource gates in [NEXT.md](NEXT.md) remain release limits.

## Artifact and environment

The final [installed identity](host/group-final/package-identity.json) is
`freelens-readable-logs@0.1.34`, stable package/store `freelens-readable-logs`,
page/config `readable-logs`, schema 3, pinned Freelens **1.10.3**. SHA-256:
`d19f826bc8496a6ae3ca5afaeb79fab73753ceeebde62747174b8d4ead6dfcb3`.
Installed main/renderer/versioned worker hashes equal the local build. Electron
**41.10.0**, embedded Node **24.18.0**, Chromium **146.0.7680.216**; project-local
Node **24.18.0** / npm **11.16.0**. Host CWD is `/home/max`; watcher polling uses
`CHOKIDAR_USEPOLLING=1`, `CHOKIDAR_INTERVAL=100`; `FREELENS_UI_MODE` stays unset.

[Fresh confirmation identity](host/bounded-final/package-identity.json) verifies
the same final package and installed assets in the fourth profile/process.

Fresh isolated profiles/processes distinguish the original package, first
partial fix and three final-package runs, with one real Extensions-form submission
before any cluster in each process. A package is never overwritten to bypass module caches.
[Original identity](host/geometry/package-identity.json) retains SHA-256
`1775d0f0aaa1d23002bf723d68c6840fa44d2c6bd3c5536e72bbc05546f0fdf1`;
the intermediate package is `cfed85e2fc8397ec4963c11c64ffe2a23fb21e0d694bc944030a811801fb8bae`.

The separate labwc → Hyprland session uses the checksum-recorded private
Aquamarine diagnostic build from [cadence.md](cadence.md), with natural frames
on its own workspace 7. This is **not stock compositor, physical input or platform
acceptance**. CSS widths and DOM selection are explicit renderer probes. No user
window activation/restoration, pointer movement, clipboard, native input or fake
`document.hasFocus()` is used. Two independently recorded real-desktop intervals
cover the five profiles.

## Production defect and TDD

Dense installed log rows exposed lost grouped-mark cycling. Revealing a result
can resize the rail as highlighting feedback changes. Rebuilding a group reset
its last selected member; repeated clicks on the current live control returned
to the first record. A [production-browser regression](host/geometry/group-regression-red.txt)
fails specifically at `Rail resize reset repeated-click cycling to its first member`.
The first correction passed that regression, but [installed retesting](host/geometry-fixed/marks-following-first-fix-failed.json)
exposed another reset while metadata maintenance temporarily hid the rail.
[A second red regression](host/geometry-fixed/group-maintenance-red.txt) fails
specifically at `Current snapshot maintenance reset grouped-mark progress`.

`FindMarks` now retains one last explicitly activated occurrence across regrouping
and pending maintenance. A rebuilt group inherits progress only if it contains
that occurrence. Query revision/context changes reset progress; eviction removes
the saved reference; disposal releases it. Existing per-group progress, complete
matching membership, stale-control guards and current-geometry reveals remain.
The viewer supplies the logical query revision separately from snapshot/message
maintenance. No parsing, profile-selection, retention, acquisition, matcher,
worker policy, copy, following or Pause contract changes.

[Both red/green regressions](host/geometry-fixed/group-maintenance-green.txt)
pass at the authorized production-renderer seam. The existing pure mark tests
and typecheck also pass. No new test seam or fallback is introduced.

## Installed source and geometry checks

[192 final-package assertions](host/group-final/surfaces.json) pass against owned
real Kubernetes logs, the packed renderer, real SDK and trusted worker:

- Empty Find accepts exactly 256 astral code points (512 UTF-16 units), rejects
  257, rejects LF/CR/U+2028/U+2029 and short foreign-surface selection.
- Inline, Side and Bottom each exercise Application text, Transport line,
  Extracted message and All fields selection. Exact original slices and active
  decoded message seed; pretty indentation and decoded non-message values without
  original provenance do not. These are DOM Ranges, not physical selection/copy.
- Actual row/rail measurements cover **260/390/700/1,440 CSS pixels**, a wrapped
  20,000-character message, inline expansion/closure, hidden-source inspection,
  Raw/Readable changes, font loading/readiness and a click before queued geometry
  remeasurement. Each sample retains projected and actual coordinates and complete
  group membership; grouped slots are allowed at narrow widths.
- Mark actions preserve independent reading/inspection/Pause, focus the Find
  input, resolve current geometry and keep exact DOM selection/source nodes.
  Every width keeps the black/no-counter canvas, separate compact toolbar/Find
  bar, bounded named native buttons and no viewer horizontal overflow.

This source/geometry subset also passed on the original and intermediate packages;
their JSON stays separately scoped. Passing it did not erase the dense cycling
failure. The final dense/following, lifecycle and regression results are retained
beside the final identities; their remaining limits remain explicit in the matrix.

## Independent completed host checks and remaining dense gate

In the fresh `bounded-final` process, [six following assertions](host/bounded-final/following.json)
pass independently of the dense cycling scenario. Real appended snapshots move
the followed bottom and retain the old active result; scrolled-away append keeps
the viewport anchor. To bottom does not Resume; paused append is not fetched,
explicit Refresh follows the new bottom while staying paused, and resize/Close
preserve following/Pause. These are DOM scroll events and actual acquisition,
not physical wheel or native window delivery.

Current-package confirmations also pass:

- [33 DOM state assertions](host/bounded-final/state-acceptance.json) and
  [13 controlled held SDK-delivery assertions](host/bounded-final/held-replies.json).
  Their exact scope remains that of the reproducers, including DOM composition
  and injected transport errors rather than native editing or natural failures.
- [Terminal-Q source/highlight samples](host/bounded-final/long-source.json),
  [10 SDK/frame cases](host/bounded-final/sdk-suite.json),
  [startup-inclusive timeout and actual exit](host/bounded-final/startup-timeout.json)
  at **1,000.81 ms**, and [20 cancellation bursts](host/bounded-final/actual-host-churn.json).
- [Fresh-main Disable/startup, reactivation, idle Uninstall and single-submit
  reinstall](host/bounded-final/extension-lifecycle.json) pass before any cluster.
- [Mounted resources](host/bounded-final/mounted-soak-clean-inspector.json) pass
  the existing thresholds with three warmups/six measured cycles per bound.
  Dense retained growth: **+5 nodes, zero listeners, +669,768 B heap, +3,432,448 B RSS**.
  Long: **+5 nodes, zero listeners, +173,388 B heap, −344,064 B RSS**. Actual worker
  exits and empty owner/retirement/sender state are observed after teardown.
  These short modified-compositor samples do not establish a long RAM/disk
  plateau, native latency or stock-display acceptance.

The separately retained **dense wrapped repeated-click/cadence gate is unfinished**.
In `group-final`, cycling progressed through records 0–9 after the final fix,
then stopped progressing during minute-spaced probes. A concurrent independent
[cadence probe failed](host/group-final/frame-cadence.json): only **9 of 61**
natural frames arrived within its three-second observation. The renderer was
observed at approximately 96% CPU. [Pre-stop state](host/group-final/dense-stalled-before-stop.json)
and [forced private-process stop](host/group-final/dense-stopped.json) are retained.
`Runtime.terminateExecution` did not settle the async test Promise. SIGTERM did
not end the owned host within ten seconds, so it was killed. This is **not** a
passing shutdown, responsiveness, grouped-cycle or resource run; attribution to
product/layout/host/private compositor is unresolved. Independent short-resource
passes above do not erase it.

The [exact stalled harness source](host/group-final/stalled-harness.mjs.gz),
recovered from its earlier staged Git blob, has a separate
[identity](host/group-final/stalled-harness-identity.json). It preserves the old
async rAF loop for diagnosis instead of requiring reconstruction from the newer
Node-polling script. Expand it beside `driver.mjs` under a new owned filename to
resolve its imports; use a fresh private profile/fixtures and an explicit driver
timeout. It remains failed diagnostic scaffolding, not a production fallback.

The harness now supports independent `FIND_HOST_SCENARIO=groups|following|both`,
uses bounded Node-side DOM/state polling for groups, and captures ready-state
observations and click eligibility atomically. Earlier two-request sampling
races are retained separately as harness-precondition failures. A closed CDP
target now rejects pending driver requests instead of leaving unresolved waits.
No timer policy, focus guard or production execution mechanism is bypassed.
The groups command records its **90-second driver budget**, distinct from the
production matching attempt's one-second deadline; its explicit result is in
[groups-command.json](host/bounded-final/groups-command.json). No complete dense
cycle/cadence acceptance is inferred from partial progress.

The bounded run's failed oracle at **click 19** is also retained:
the current first slot contains records **0–17**, while the previous result **18**
is absent. Selecting **0** is correct; the harness incorrectly predicted **1**
by applying modulo arithmetic to the old row index. Independent Spec review
caught that error. [Original trace/verdict](host/bounded-final/marks-following.json)
and [command/elapsed time](host/bounded-final/groups-command.json) preserve the
failed harness run (**39.71 seconds**, exit 1), **not a confirmed product mismatch**.
The corrected oracle uses the fixture's current ordered members and starts at
the first when the previous member is absent. This correction does not erase
the separately failed cadence run or establish full dense acceptance by itself.

The [fresh corrected run](host/review-oracle/marks-following.json) passes all
**six scoped assertions**, with **37 activations** (`18×2+1`): records 0–17 cycle
twice and return to 0. Complete population stays **1,000** independently of the
**1,024** DOM highlight cap; incomplete feedback, current-group distinction,
Find focus, inspection/Pause, history and stale-dismissed-control behavior pass.
[The command](host/review-oracle/groups-command.json) exits 0 in **70.89 seconds**.
This whole scripted run is not a per-input latency measurement. Its final state
has **two worker starts/two actual exits**, zero live workers, and empty owner/
opening/retirement/sender maps with no sweep. Its [installed identity](host/review-oracle/package-identity.json)
again matches the final artifact. The immediately preceding run completed the
five cycling/ownership assertions but sampled decoration feedback during
maintenance; that failed harness snapshot is retained as
`groups-feedback-precondition.json`. The final snapshot is now captured atomically.
The earlier natural-cadence failure remains unresolved and is not promoted to a
pass by these later scripted observations.

[Normal startup shutdown](host/bounded-final/shutdown-clean.json) in the independent
fresh process observes actual exit, a closed service and zero owners/opening/
retirement/senders/sweep before process exit **0**. It does not erase the forced
stop of the stalled earlier process or establish physical window-button delivery.
[Driver close check](host/bounded-final/cdp-close.json) verifies pending CDP requests
reject when their connection closes.

Independent Spec review also found post-close sends could otherwise remain
unresolved. The driver now rejects non-OPEN sockets and send callback errors.
[Fresh actual transport checks](host/review-oracle/cdp-close.json) verify both
pending-at-close and post-close rejection. Attended-input guards stay in place.

## Final checks, review and cleanup

[Exact commands/environment and final verdicts](host/bounded-final/checks.json)
record locked installation, typecheck, **249 tests**, focused marks, six UI guards,
production browser, real workers, resource smoke, strict packed checks and
[two-build reproducibility](host/bounded-final/reproducibility.json), all passing.
Two earlier browser failures remain in separately named logs. Browser assertions
now allow reuse of valid current-key late-source ranges (visible terminal Q and
actual late-source scope remain required) and wait for current measured geometry
instead of imposing precisely two frames. Independent review confirms neither
another dispatch nor a two-frame readiness limit is an accepted guarantee.

[Cumulative independent Standards and Spec review](review-geometry.md) uses the
original ticket pin `3fb33db5f5ded3523bcf66c1145f0af967ec0bf3` and this
continuation's `f8d7643` baseline, including current uncommitted work. Two harness
findings are corrected; no actionable finding remains. Optional repeated probe
helpers/screenshot-pump duplication is deferred. Whole-ticket acceptance remains open.

[First cleanup/desktop interval](host/bounded-final/cleanup.json),
[desktop summary](host/geometry/desktop-summary.json), and the fresh review-run
cleanup retain ownership/PID/UID checks and saved user/configuration hashes.
Four initial profiles, their credentials and the first private runtime are
removed with no owned process left. The first 2,180-second desktop interval has
**21,801 notifications of the same already-active window**, zero workspace/client
events, and equal focus/workspace/client lists and pointer endpoints. It is not
called zero events or physical-input continuity. [Fifth-profile cleanup](host/review-oracle/cleanup.json)
confirms three total worker starts/exits including startup shutdown, zero owned
processes, and removal of its credentials/profile and second private runtime.
[Its separate 485.65-second interval](host/review-oracle/desktop-summary.json)
has 4,856 same-active-window notifications, zero workspace/client events and equal
desktop/pointer endpoints. Recorded user/configuration bytes remain unchanged in
both intervals. No .ralph runtime, private credentials or raw heap snapshot enters
the commit.

## Failed attempts and reproduction

Original failures remain under `host/geometry/`, `host/geometry-fixed/` and
`host/group-final/`. Harness corrections are separate from product fixes:
the first seed tried disabled Clear on empty input; a narrow-width measurement
incorrectly required separate marks instead of valid grouped slots; a two-frame
sample preceded settled inline layout; an unwrapped dense viewport had complete
coverage, so it could not assert incomplete feedback. The live-control cycling
failures persisted after those corrections and produced the two red tests above.
A later sample read a pending maintenance state; the final harness waits for
current matching and decoration before asserting the completed click result.

`group-clear-diagnostic.json` is a **debugger logpoint diagnostic**, not an
acceptance/timing run. A condition at the built `FindMarks.clear` records actual
call stacks without pausing; the breakpoint is removed and Debugger disabled in
`finally`. It identifies `update` with temporarily empty matching input. Its
latencies and modified inspector state are not credited to acceptance.

Keep `FREELENS_UI_MODE` unset. Use a new safe run name and fresh owned namespace
for reproduction; do not reuse cleaned PID/profile/namespace identities:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
node --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js --version
export FIND_HOST_TICKET=48 FIND_HOST_RUN=group-final
python3 scripts/find-production-host/prepare.py
python3 scripts/find-production-host/fixtures.py
python3 scripts/find-production-host/surface-fixture.py
# Separate supervised display/host processes; diagnostic build from cadence.md.
FIND_DISPLAY_RENDERER=mesa LD_LIBRARY_PATH="$PWD/.scratch/find/48-host/aquamarine/build" python3 scripts/find-production-host/display.py
python3 scripts/find-production-host/launch.py
node scripts/find-production-host/install.mjs
node scripts/find-production-host/cdp.mjs 9242 main scripts/find-production-host/observer.cjs
node scripts/find-production-host/lifecycle.mjs # fresh main, before any cluster
node scripts/find-production-host/open-view.mjs
node scripts/find-production-host/surfaces.mjs
node scripts/find-production-host/marks-following.mjs
```

`marks-following.mjs` appends only to the newly owned surface fixture. Repeating
its full run requires recreating that owned fixture or a new namespace; do not
alter shared fixtures to force its initial 180-record precondition.
