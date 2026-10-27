# #48: weak viewer roots and natural idle at a failed resource sample

Continuation/review baseline: `863db9d74786a2ee4e689bf0fe3e464c47597cd5`.
Original ticket pin: `3fb33db5f5ded3523bcf66c1145f0af967ec0bf3`.
Selected **Verify production Find against the acceptance matrix**, reclaimed with
`gh issue edit 48 --add-assignee @me` before changes. [Live authority](host/weak-idle/authority.json)
matches complete cached #36/#37/#38/#40/#48 bodies/comments; the accepted plan is
byte-identical to the `d02b7e7` source.

This is a partial investigation, not ticket completion or release acceptance.
Production bytes, accepted behavior and every-sample resource thresholds remain
unchanged. No unfinished original whole criterion is newly checked.

## Diagnostic and checks

`viewer-roots.mjs` retains at most 256 WeakRefs to mounted owned `.readable-logs`
roots, with a WeakSet preventing duplicates. The final version captures within
the existing active-state CDP evaluation, avoiding another pre-unmount round trip.
On a violating sample it immediately inspects reachable roots and their detached
subtrees with non-piercing `DOMDebugger.getEventListeners`, including assigned
handlers. Evidence contains node counts/classes, native IDs and handler locations,
never text, callback values or source code. Temporary target/handler handles are
released before returning. Caps and cleanup failures fail explicitly.

The original failed counters and verdict are retained separately. The same idle
host is observed at 0, 250, 1,000, 5,000 and 15,000 ms without navigation, another
workload, `queryObjects`, heap capture or explicit GC during that comparison.
Natural GC can occur. Optional tracing records sanitized native scroll/lifecycle
and GC event names/counts/times; it begins **after** the immediate root census.
Trace events cannot identify which viewer a queue held or prove queue emptiness.
Optional `postIdleGc` is a later, separately labelled collectibility diagnostic;
it is outside the completed no-forced-GC comparison and never replaces a failure.

The owned-DOM [initial self-check](host/weak-idle/viewer-roots-check.json) observes
both an assigned click handler and a registered child handler while connected
and detached, then observes removal. The [idle self-check](host/weak-idle-check/viewer-roots-check.json)
also exercises all five idle samples and native tracing. Its root is deliberately
strongly held by the check; it does not pretend to test that root's collection.
The [red import failure](host/weak-idle/census-red.txt) precedes helper implementation;
it is a diagnostic-development result, not a production failure.

Independent review caught the first census being delayed by trace startup. The
final version records `violatingViewerRoots` first. The earlier loaded run remains
separate; its [harness diff](host/weak-idle-extended/harness-before-review.diff.gz)
is retained. Initial and final growth now share one calculation, preserving limits
of +128 nodes, +8 listeners, zero document growth and +8 MiB renderer heap at every
measured sample. A later idle drop never turns the original verdict into a pass.

## Observed failure and its limits

The initial 30-cycle-per-bound diagnostic passes: dense and long peaks both have
+29 nodes and zero listener growth. It captured no violating sample and does not
clear earlier failures.

The extended older-harness run has 120 measured cycles per bound after three
warmups. Dense peaks +119 nodes/zero listeners. **Long cycle 119 fails at +10
listeners against the +8 limit**, with +119 nodes and zero document growth.
Its failed counters are 905 nodes/762 listeners. No root wrapper is reachable through the 246 weak captures at the failed sample's
first census; global counters still exactly equal the failed sample there. This
is a reachable-wrapper census, not a global native-DOM inventory or exclusion of
every possible listener owner or retainer.

The same failed counters remain unchanged through 5,000 ms. By 15,002 ms they are
883 nodes/753 listeners, a drop of 22 nodes and nine listeners, without a forced
collection during the comparison. Native trace records natural MajorGC and
lifecycle/scroll-tree processing. No `scrollend` dispatch is established, and the
events are not tied to any specific retained target. This demonstrates eventual
cleanup for this listener spike, not exclusive native-queue attribution. Its
every-sample resource verdict stays **failed**; the independent verdict audit
checks that truthful failure rather than reporting resource acceptance.

The supervisor's specific **+1,551-node/+26-listener detached-viewer hypothesis**
remains unproven for the original normal-frame-drain workload. Neither the +10
spike nor the related timing control below substitutes for that earlier sample.

## Corrected run, timing control and plain comparison

Every raw sample, idle observation and separate post-idle collection is retained:

| Run | Measured cycles per bound | Dense peak nodes/listeners | Long peak nodes/listeners | Verdict |
| --- | ---: | ---: | ---: | --- |
| [Initial weak capture](host/weak-idle/mounted-soak-clean-inspector.json.gz) | 30 | +29 / 0 | +29 / 0 | Scoped pass; no failure captured |
| [Extended older harness](host/weak-idle-extended/mounted-soak-clean-inspector.json.gz) | 120 | +119 / 0 | +119 / +10 | Failed, one violating sample |
| [Corrected immediate census](host/weak-idle-final/mounted-soak-clean-inspector.json.gz) | 120 | +50 / 0 | +203 / +36 | Failed, 27 violating samples |
| [Undrained timing control](host/weak-queue-control/mounted-soak-clean-inspector.json.gz) | 6 | +5 / 0 | +1,524 / +25 | Control fails; not original workload acceptance |
| [Plain repetition](host/weak-idle-plain/mounted-soak-clean-inspector.json.gz) | 30 | +29 / +6 | +29 / 0 | Scoped pass; cannot clear any failure |

The corrected run's 27 failures occur in the long workload, cycles 88–119.
No root wrapper is reachable in their immediate censuses. Counters can change
during observation: cycle 104 already has four more listeners at census entry;
cycle 115 gains four during its census. Both before/after values remain recorded.
The early +9 spikes generally drop during natural idle, but later growth does
**not** all disappear: cycle 119 ends idle and the separate GC at 1,129 nodes/763
listeners, still **+182 nodes/+27 listeners** against its 947/736 warm baseline.
This is persistent at that bounded observation, not proof of an indefinite leak
or exclusive host/extension attribution. The 826-second run includes 15-second
observations at failures; it is not an input-performance measurement.

The **timing control** changes only the diagnostic's post-unmount two-frame wait:
warmups and cycle 0 retain it; later measured cycles omit it. Matching, snapshots,
inactivity and actual worker exit remain exercised. This deliberately changes
measurement timing, not production disposal or the normal-workload verdict.
Four of five undrained long samples capture exactly one disconnected viewer root,
each with **1,436 subtree nodes and 24 attached listeners**. Global deltas are
+1,520 to +1,524 nodes/+25 listeners; the root alone does not account for every
global node/listener. One skipped-drain sample captures no violation.

Those four roots remain reachable through 5 seconds and disappear by the
15-second sample **without explicit GC during the comparison**. Natural MajorGC,
`ScrollTree::CollectScrollDeltas`, `InputHandler::ClearCurrentlyScrollingNode`
and completed lifecycle-update events are observed. No specific target's queue
emptiness or `scrollend` dispatch is established. Weak-wrapper reachability until
GC does not establish that a strong retainer lasted that whole interval. The
control demonstrates eventual collection of a detached viewer and a related
global spike; it does not prove the original +1,551/+26 sample's cause. A later
[heap](host/weak-queue-control/retaining-paths.json) finds zero viewer sections;
that later result never replaces the control's original failing counters.

The [later attached census](host/weak-queue-control/post-idle-census.json) covers
665 document/Window listeners and records concurrent global counter changes.
The [post-plain native heap](host/weak-idle-plain/listener-heap-post-plain.json.gz)
contains 794 EventListener nodes, zero viewer DOM nodes, 643 host `ClusterView`
nodes and 120 EventListener paths through AbortSignals. Representative shortest
paths go through HTTPParser/ClientRequest or native DOMTimer/AbortController
chains. In 101 of those paths, AbortSignal is the nearest preceding native object
after ignoring InternalNode; the broader 120 count includes paths that continue
through other native objects. This distinction is recorded with the exact predicate
in [the native-path count audit](host/weak-idle-final/native-path-counts.json). These are **later collected-heap paths**, not the exact failed-sample
listener inventory, a dominator proof or exclusive attribution. They narrow the
next investigation toward request/timer ownership without inventing a product
fix. Raw private heaps are removed. Probe sources are retained beside the results.

[Resource summary](host/weak-idle-final/resource-summary.json) includes warm/last
main and renderer RAM, every per-metric peak, disk bytes/files, settings equality,
threads and all failing idle comparisons. Whole-profile disk grows 1,885–51,685
bytes per measured bound with zero new files; extension settings stay identical.
Every run has an independent `verdict-audit.txt`: audit success validates truthful
every-sample reporting, not a green resource gate. No sample or threshold is erased.

## Environment and reproduction

[Installed identity](host/weak-idle/package-identity.json): Freelens 1.10.3,
Electron 41.10.0, Node 24.18.0, Chromium 146.0.7680.216, npm 11.16.0. Stable
`freelens-readable-logs@0.1.34` package/store, `readable-logs` page/config, schema 3.
Main/renderer/worker installed hashes equal local assets; package SHA-256 remains
`995f1cf5e3ac81f377b16cf8dea24c15237824cd31dd1a066acde26bf868f904`.
Host CWD `/home/max`; process-local polling uses `CHOKIDAR_USEPOLLING=1` and
`CHOKIDAR_INTERVAL=100`. Fresh private profile, one Extensions-form installation,
no overwrite or post-install restart. Private labwc → Hyprland workspace 7 uses
the previously documented modified Aquamarine diagnostic, not stock-display
acceptance. FREELENS_UI_MODE remains unset.

From this checkout, select the documented toolchain and a new owned run/profile:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PWD/.scratch/readable-logs/toolchain/node_modules/.bin:$PATH"
export FIND_HOST_TICKET=48 FIND_HOST_RUN=weak-idle
python3 scripts/find-production-host/prepare.py
python3 scripts/find-production-host/fixtures.py
# Supervise these two long-lived commands separately:
FIND_DISPLAY_RENDERER=mesa LD_LIBRARY_PATH="$PWD/.scratch/find/48-host/aquamarine/build" python3 scripts/find-production-host/display.py
python3 scripts/find-production-host/launch.py
node scripts/find-production-host/install.mjs
node scripts/find-production-host/cdp.mjs 9242 main scripts/find-production-host/observer.cjs
node scripts/find-production-host/open-view.mjs
node scripts/find-production-host/identity.mjs
FIND_ROOTS_CHECK_IDLE=1 node scripts/find-production-host/viewer-roots-check.mjs
FIND_SOAK_INSPECTOR_CLEAN=1 FIND_SOAK_NATURAL_FRAMES=1 FIND_SOAK_CYCLES=120 FIND_SOAK_IDLE_MS=100 FIND_SOAK_VIEWER_ROOTS=1 FIND_SOAK_IDLE_COMPARE=1 FIND_SOAK_IDLE_TRACE=1 FIND_SOAK_POST_IDLE_GC=1 node scripts/find-production-host/mounted-soak.mjs
```

Use separate evidence run names and copy only the owned fixture descriptor when
repeating in the same host. Plain comparison omits roots/tracing/post-idle-GC
flags. The idle-compare flag alone can retain natural-idle counters at a plain
failure. Three warmups, the original retention fixtures and thresholds remain.
Lossless gzip evidence is recoverable with `gzip -dc`.

For the timing control add `FIND_SOAK_UNDRAINED_CONTROL=1` and use six cycles;
the output explicitly identifies the changed timing. The corrected run's exact
[tested harness](host/weak-idle-final/harness-tested.diff.gz) predates that optional
flag; its normal workload is unchanged. The initial older-harness diff is separate.

## Final checks, cleanup and remaining work

[Exact commands/environment/exits](host/weak-idle-final/host-commands.json) index
the host work. [Final regression commands](host/weak-idle-final/final-checks.json)
pass pinned locked install, typecheck, **249 tests**, six UI policy tests, mounted
production browser, actual built workers, original resource smoke and strict
packed checks. [Two builds](host/weak-idle-final/reproducibility.json) reproduce
the unchanged installed SHA-256. The failed installed resource gate stays separate.

[Startup shutdown](host/weak-idle-final/shutdown-clean.json) observes **1,031 actual
worker starts/exits**, peak one, zero live workers and empty owner/opening/retiring/
sender/watch state. Three SDK handlers are still listed at `will-quit`; no zero
SDK-handler claim is made at that instant. The app exits normally. [Owned cleanup](host/weak-idle-final/cleanup-profile.json)
removes its profile and UID-checked namespace, with unchanged fresh hashes for
user settings, dirty glossary and docs index. The private display PIDs and owned
runtime are gone; build/cache and unrelated user data remain.

[Desktop observation](host/weak-idle-final/desktop-summary.json) retains 22,379
notifications. Existing client sets match and no real-desktop window opened or
closed, but monitor/focus/workspace activity occurred, including `FALLBACK` output
events. Focus/workspace/pointer endpoints differ. **No unchanged-desktop claim is
made.** No native input, pointer/clipboard operation, activation, focus restoration
or fake focus was issued, and test windows were confined to private workspace 7.
The observation does not attribute those external state changes to a cause.

[Independent review](review-weak-idle.md) records Standards and Spec separately.
The concrete next work is exact request/timer/native-owner attribution with the
original failures preserved, plus remaining target/viewer delivery and independent
anchor-eviction counterparts. [NEXT.md](NEXT.md) gives the handoff. Passing controls
do not authorize a new resource-measurement policy or a pinned-host workaround.

Full remaining Host/key/trace, physical selection/copy/clipboard, native editing,
IME/AltGraph/shortcuts/menus/focus/window, stock-display/long-duration resources
and Windows/macOS gates remain explicit in [the matrix](matrix.md). No GitHub
comment/closure, push, merge, PR, release or pinned-host patch occurred.
