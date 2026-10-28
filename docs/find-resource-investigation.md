# Find resource investigation and remaining acceptance

Updated 2026-10-28. This document preserves the resource failures found during
Find acceptance [#48](https://github.com/maksimgurenko/freelens-json-logs/issues/48)
and the 2026-10-27 decision to defer them. The user reopened the investigation on
2026-10-28. Current functional/native acceptance is tracked separately in the
[execution handoff](verification/48/NEXT.md) and [matrix](verification/48/matrix.md).

The original summary below covers reviewed diagnostics through commit `27e4d82`.
Its failed measurements and unchanged thresholds remain recorded.

## Resource follow-up closed: 2026-10-28

After reviewing the findings, the user directed closing this resource issue.
The resource checklist item in [#48](https://github.com/maksimgurenko/freelens-json-logs/issues/48)
is closed as an accepted host-side limitation. No further resource work is
scheduled. The confirmed Freelens watch-timer defect and the passing 100-cycle
comparison are recorded below; complete ownership of every historical spike
remains unresolved. Closing the follow-up does not claim a production fix or
change failed measurements into passes. #48 remains open for Windows/macOS
validation.

## Reopened investigation: 2026-10-28

A fresh traced Find run reproduced listener failures in 15 samples, peaking at
**+21 listeners**. A minimized control using actual host Kubernetes watches,
with neither log viewer mounted, found a concrete host retention defect:
aborting a watch leaves its **660-second fallback timer** running. Repeated
watch/abort calls retained **two listeners per watch**. Cancelling only that
timer prevented the growth; the paired result repeated twice.

This establishes a host contribution, not complete attribution of the original
+1,551-node/+26-listener sample. No production extension or pinned host fix has
been applied. The [new investigation report](verification/48/resource-reopened-20261028.md)
contains the causal control, original failure checks and reproduction command.

The requested comparison then completed **100 open/close cycles per viewer** on
the same Pod continuously producing logs, with a fresh Freelens process/profile
between viewers and Find unopened. Both retained **zero additional DOM nodes,
listeners or documents** at every measured sample. Each also received new logs
automatically in a separate 11-second check. This open/close comparison does not
exercise the cluster inactive/active transitions in the original failed workload;
those failures remain recorded.

## Accepted deferral

On 2026-10-27 the user directed: “if the issue is part of
docs/find-resource-investigation.md we just skip it for now, mark it accepted.
we will deal with that later”.

At that checkpoint, the DOM/listener resource issue was **accepted for now and
deferred**, and attribution, timing controls, soaks and related stock-display
investigation stopped. The current request reopens diagnosis. The earlier
acceptance decision did not turn failed measurements into passes, and the
original thresholds remain unchanged. No root-cause fix is claimed.

The remaining functional host cases, native-input checks and platform coverage
are not waived by this resource decision. Their status stays explicit below.

## What is failing

Repeatedly opening, searching, deactivating and closing the installed viewer can
leave higher DOM-node and event-listener counts after teardown. DOM nodes are
objects such as rows, text and controls; listeners are callbacks attached to
events. Persistent growth could make a long-running Freelens session consume
more memory or become slower.

The counters cover the host renderer, including Freelens UI and the extension.
A higher counter does not identify the owner or prove a permanent extension leak.
The investigation therefore compares host-only navigation, a viewer without
Find, Find workloads, inactive/active transitions, and instrumented/plain runs.

The existing resource policy checks **every measured sample** against its warm
baseline, including limits of +128 DOM nodes, +8 listeners, zero additional
documents and +8 MiB renderer heap. Passing the last sample cannot conceal an
earlier failure. Limits have not been relaxed.

| Observation | What it establishes |
| --- | --- |
| A long-source sample retained **+1,551 nodes and +26 listeners**. | A real failed resource sample; its exact ownership/cause remains unresolved. [Evidence](verification/48/exact-listeners.md#resources-and-limits) |
| Host-only inactivity retained **14 `ClusterView` nodes over 15 samples**, repeated without heap/listener instrumentation. | Some measured node growth originates in Freelens without an extension viewer. It does not explain every listener failure. [Evidence](verification/48/listener-attribution.md) |
| A newer 120-cycle-per-bound run peaked at **+203 nodes/+36 listeners** in the long-source workload. | Longer runs still breach the original limits. Some spikes clear during idle; others persist beyond the sampled idle/collection checks. [Raw run](verification/48/host/weak-idle-final/mounted-soak-clean-inspector.json.gz) |
| A plain 30-cycle-per-bound repetition passed. | The failure is intermittent. A passing repetition does not resolve the failed runs. [Raw comparison](verification/48/host/weak-idle-plain/mounted-soak-clean-inspector.json.gz) |

Workers and viewer owners do shut down in the recorded lifecycle checks: actual
worker exits and empty owner/request maps are observed. The remaining problem is
broader DOM/listener retention, rather than evidence of workers accumulating.

## Production fixes made during validation

These are verified functional/rendering fixes. They do **not** establish that
the intermittent resource failure is fully fixed.

| Fix | Why it was needed | Result |
| --- | --- | --- |
| Observe clipping ancestors and correctly reuse/project current ranges (`55dde78`). | A visible terminal match in a roughly 5 MiB record was counted but not highlighted. Feedback could change the clip without invalidating the correct source interest. | The installed terminal-match check passes; exact counts and original text remain intact. [Report](verification/48/cadence.md) |
| Preserve mark-cycle progress through regrouping and matching maintenance (`9280757`). | Scrollbar groups could lose their cycling position when layout or matching maintenance rebuilt them. | Mounted regressions and corrected installed grouped-mark checks pass. [Report](verification/48/geometry.md) |
| Reserve a compact, stable feedback footprint while Find is open (`a098a21`). | “Highlighting incomplete” changed viewport height, moving visible matches across the 1,024-range cap. Feedback then disappeared/reappeared, triggering repeated layout and decoration work. | The old cap-boundary regression fails; the fixed version passes. The installed dense sample delivers 12 natural frames in about 186 ms. This is a small diagnostic sample, not a native-input latency guarantee. [Report](verification/48/dense-cadence.md) |

That checkpoint's production package was `freelens-readable-logs@0.1.34`, SHA-256
`995f1cf5e3ac81f377b16cf8dea24c15237824cd31dd1a066acde26bf868f904`.
Pinned typechecking, 249 tests, six UI-policy checks, production-browser tests,
actual-worker tests, resource smoke, strict package checks and reproducible
two-build packaging pass. The separate installed-host measurements still include
failures; their accepted deferral is recorded above.

## Test environment and measurement corrections

The first private nested display had a 0×0 output and stalled native frame/scroll
processing. A scratch-only Aquamarine diagnostic patch enabled natural frames
in the isolated display; installed system libraries and the user's compositor
were unchanged. This removed the earlier large retained-view symptom in minimal
controls, but it is a **modified diagnostic environment**, not stock-display
acceptance. [Display diagnosis](verification/48/cadence.md#two-independently-identified-problems)

The soak originally checked only endpoint growth. That false-pass path was
corrected in `3555efc` to enforce every sample. Diagnostics now preserve failed
samples, release temporary inspector handles, distinguish reachable callbacks
from actually attached listeners, and verify restoration/cleanup before reporting
success. Raw heap snapshots are removed rather than committed.

The last diagnostic observations used bounded weak references to viewer roots and
observes failed samples for up to 15 seconds without forced collection. One
listener spike dropped by nine during that idle interval while all 246 captured
viewer roots were already collected. A separately labelled timing control,
which deliberately omits the usual post-unmount frame drain, reproduced one
detached viewer with 1,436 subtree nodes and 24 attached listeners; it disappeared
with most of the spike by 15 seconds. This supports eventual cleanup **in those
observations**. It does not prove the cause of the original +1,551/+26 failure or
make the original resource verdict pass. [Investigation](verification/48/weak-idle.md),
[timing-control data](verification/48/host/weak-queue-control/mounted-soak-clean-inspector.json.gz)

## Acceptance status at the deferral (historical)

Later functional/native results are recorded in the current
[execution handoff](verification/48/NEXT.md); the table below preserves the
scope of the earlier deferral.

| Area | Remaining check |
| --- | --- |
| Resource behavior | **Accepted for now; deferred.** Attribution and further RAM/DOM/listener/disk/thread soak work are follow-up work, not current blockers. |
| Stock environment | Further stock-display investigation for this resource issue is deferred. Existing private-compositor evidence still does not establish native input or stock-platform behavior. |
| Host races and independent state | Completed at the installed controlled-DOM/SDK layer on the final artifact: target/viewer stale-success and stale-failure cases, and independent reading-anchor preservation when a different inspected record is evicted. [Final report](verification/48/functional-final.md). |
| Native Linux interaction | Fresh attended or suitable separate-session checks for physical selection/copy/clipboard, native typing/paste/Undo/Redo, IME/AltGraph, actual modifier shortcuts and menus, focus return, and native window lifecycle. Synthetic DOM events do not satisfy these checks. |
| Windows and macOS | Matching/worker/package execution, primary-modifier shortcuts, IME, selection/copy, focus and lifecycle checks remain explicitly unverified. The ticket's checkbox for **recording** this limitation is satisfied; actual platform coverage is not. |
| Final matrix | [Reconciled D01–D16 and all 13 traces](verification/48/matrix.md) against the final artifact; passed, accepted/deferred and unperformed layers stay separate. Native/platform coverage is not inferred from browser/DOM checks. |

Already recorded functional coverage includes literal Unicode matching, workers
and frame ownership, state/refinement/history, hidden-source inspection,
measured marks, actual snapshot/restart/Pause/following behavior, and exact
5 MiB ±1-byte/newest-1,000 retention checks. These do not all need to be rebuilt;
the outstanding work is the non-deferred gaps and release gates above.

The detailed [acceptance matrix](verification/48/matrix.md) and
[execution handoff](verification/48/NEXT.md) retain the individual cases and
reproduction commands. The resource execution/reporting criterion is now accepted
under the user decision, alongside explicit platform-limit reporting and honest
verdict reporting. This is not a count of passing functional tests. No full
release acceptance, push or publication is claimed.
