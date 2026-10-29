# Resource investigation reopened on 2026-10-28

The user reopened the resource investigation, then requested a comparison of
100 open/close cycles in our viewer and the default Freelens log viewer, with a
restart between them and the same Pod actively producing logs. The earlier
accepted deferral and failed measurements remain historical evidence; neither
thresholds nor release criteria have been changed.

After reviewing these findings, the user directed closing the resource
follow-up. Its checklist item in #48 is closed as an accepted host-side
limitation; Windows/macOS validation remains open. No host fix or complete
attribution of every historical spike is claimed, and no further resource work
is scheduled.

## Requested comparison: 100 opens and closes per viewer

The [comparison report](resource-comparison-20261028.md) contains the full
method, memory/RSS/thread figures, independent sample audit and cleanup evidence.

The same Pod emitted approximately ten log lines per second throughout both
runs. Each viewer received its own fresh Freelens process/profile, the identical
installed extension package and three warmups. Find remained unopened; stock
search stayed empty. The harness checked a fresh sequence on every loaded
snapshot, dwelled 500 ms, genuinely disposed the viewer, then waited 250 ms and
two natural frames before collecting and sampling. Every one of the 100 samples
per viewer was checked against that run's final warmup baseline.

| Viewer | DOM nodes, warm → final | Listeners, warm → final | Renderer heap change | Failed samples |
| --- | ---: | ---: | ---: | ---: |
| Our readable viewer | 437 → 437 | 700 → 700 | −9.20 MiB | 0 / 100 |
| Default Freelens logs | 671 → 671 | 751 → 751 | +3.53 MiB | 0 / 100 |

DOM nodes, listeners and documents had **zero growth at every measured sample**,
not just at the endpoints. The default heap peak was also +3.53 MiB, below the
unchanged +8 MiB limit. No Find worker started in either run. Separate 11-second
mounted checks confirmed automatic log updates in both viewers.

These are retained-growth comparisons, not absolute memory-efficiency rankings.
Our viewer requests/renders up to 1,000 records; stock initially requests 500 and
virtualizes its visible rows. Our full-page route and the stock dock on Overview
also exercise different host layout paths. Both runs keep the cluster selected;
the original failed workload additionally navigates the root to Extensions and
back, deactivating/reactivating the cluster. These clean open/close runs do not
clear those failures or establish an indefinite resource plateau.

## Finding: aborted host watches retain a fallback timer

A focused control reproduces listener growth **without mounting either log
viewer or using Find**. The installed Freelens `podsApi.watch` starts a fallback
timer for `timeout * 1000 * 1.1`: **660 seconds** at its default 600-second watch
timeout. Its disposer aborts the watch, but does not cancel that timer. The timer
closure still references the abort controller and watch options.

The host's own source establishes this mechanism in
the bundled `./src/kube-api.ts`, `KubeApi.watch`: the timer's callback checks
`abortController.signal.aborted` only when it fires. The `abort` listener and
returned disposer clear `timedRetry`, a different timer. The fallback timer's
handle is never saved. The source was read from the actual loaded host bundle,
whose SHA-256 is recorded in [source identity](host/resource-reopen-20261028/host-source-identity.json).
This is a host defect, not a change to the extension's worker disposal.

The focused probe uses the actual installed SDK method and actual Kubernetes
watch transport against a UID-checked disposable Pod. A private annotation
change supplies an event: Kubernetes can defer watch response headers until an
event, so simply opening an idle watch does not establish that the timer started.
The probe waits for the actual fallback timer before aborting.

| Control | Growth over seven measured intervals | Retained traced listeners |
| --- | ---: | ---: |
| Open/abort watches; retain host timer behavior | **+14 listeners**, zero DOM nodes | 18 listeners on nine aborted watches, including warmup/baseline |
| Same calls and fixture updates; cancel only each watch's fallback timer | **0 listeners**, zero DOM nodes | No additional retained targets |
| Cancel remaining control timers, release diagnostic state and collect | All newly traced listeners gone | 0 attached in both frames |

The paired control was repeated with the same result. Each untreated watch adds
two listeners; the original +8 listener gate is crossed at measured cycle 5.
The diagnostic's `pass: true` means **reproduction and the cancellation contrast
succeeded**. It is not a resource-acceptance pass. The temporary timer methods
and abort-listener tracing are restored and verified.

Evidence: [first paired control](host/resource-reopen-20261028/watch-retention.json.gz),
[independent repetition](host/resource-watch-repeat-20261028/watch-retention.json.gz).
No pinned host library, system package or production extension behavior changed.

An upstream fix should give each watch ownership of its fallback timer handle
and clear it when the watch is disposed or finishes. It also needs an
abort-before-response test: a late response must not create a timer after the
abort listener has already run. End/close/error retry paths should release the
old attempt's timer before starting another attempt. This is a proposed fix
boundary, not an implemented or validated host patch.

## Fresh Find workload and attribution limits

The ordinary six-cycle-per-bound workload passed: peak **+5 nodes/0 listeners**
at both dense and long bounds. The subsequent 30-cycle workload with weak abort
registration tracing failed in **15 dense samples**, cycles 15–29: peak
**+104 nodes/+21 listeners**. The long bound peaked +39 nodes/+1 listener.
Every sample uses its own bound's warmed baseline and unchanged limits of
+128 nodes, +8 listeners, zero documents and +8 MiB renderer heap.

At dense cycle 0, the attached traced census contained 17 listeners on seven
non-aborted host signals. At failing cycle 15, it contained those 17 listeners on
seven current signals plus **14 listeners on seven aborted host signals**.
Their registration locations are host `WrappedAbortController`, Kubernetes
store/watch, `rejectPromiseBy` and node-fetch code. This accounts for a measured
part of the growth, not every global listener or native object.

The new focused timer control establishes a causal host retention mechanism. It
does **not** prove that it explains every listener in that failing Find sample,
the historical +1,551-node/+26-listener sample, or an indefinite leak. The timer
eventually fires; its original 660-second lifetime was not waited out here.
Detached viewer roots remain a separate possible transient contribution.

The three ranked hypotheses were host request/timer retention, detached viewer
queues, and inspector retention. The paired watch control isolates a host timer
contribution. No production fix or complete attribution is claimed.

The fresh 15-cycle host-only navigation control again gained **14 nodes and zero
listeners**. Both collected heaps contained zero viewer DOM nodes. This is a
separate host contribution, consistent with the previously recorded ClusterView
growth; it does not itself explain listener failures.

Evidence: [six-cycle run](host/resource-reopen-20261028/mounted-soak-clean-inspector.json.gz),
[traced failing run](host/resource-reopen-traced-20261028/mounted-soak-clean-inspector.json.gz),
[host-only control](host/resource-reopen-20261028/navigation-control.json).

## Reproduction and checks

Use a fresh owned private host and fixture prepared as described in
[weak-idle.md](weak-idle.md#environment-and-reproduction), then run:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
export FIND_HOST_TICKET=48 FIND_HOST_RUN=<new-owned-run>
node scripts/find-production-host/watch-retention.mjs
```

The viewer must be unmounted. The run's `fixture.json` must describe the actual
owned fixture. The command fails unless untreated watches cross the original
listener threshold, timer cancellation reduces growth, and cleanup succeeds.
The actual probe output in both repetitions is +0,+2,+4,+6,+8,+10,+12,+14 listeners
without cancellation, and eight zeros with cancellation.

Two initial diagnostic attempts failed to establish the timer precondition;
their results are retained separately. The first also called a browser timer
method with the wrong receiver during cleanup; methods were explicitly restored
before continuing. The corrected probe binds native timer methods to `global`
and generates a real watch event. Neither scaffolding failure is a product
failure or a passing resource check.

The package rebuilt byte-identically to the checkout's current artifact:
`freelens-readable-logs@0.1.34`, SHA-256
`15f99148d56a5b6100b929ff79c5d9b3680c9186a36dc5d5e08706bfed67749b`.
[Installed identity](host/resource-reopen-20261028/package-identity.json) verifies
all three asset hashes and Freelens 1.10.3/Electron 41.10.0/Chromium 146/Node
24.18.0. This is the documented private modified-compositor environment, not
stock-platform acceptance. No native desktop input or clipboard operation ran.

The focused host exited normally with all workers exited and owner maps empty;
its private profile was removed. The private display and fixture were handed to
the separate fresh-process viewer comparison. See
[focused cleanup](host/resource-reopen-20261028/focused-cleanup.json) and
[shutdown](host/resource-reopen-20261028/shutdown-clean.json).

JavaScript syntax validation and all six UI non-interruption policy checks pass.
The paired live probe was run twice. No production changes were made, so the
unrelated functional matrix was not repeated.
An independent [every-sample audit](host/resource-reopen-20261028/resource-verdict-audit.json)
recomputes both fresh Find verdicts and checks both paired controls, including
zero newly traced attached listeners after cleanup.
