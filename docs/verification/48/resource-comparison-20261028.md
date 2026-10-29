# Active-log viewer open/close comparison, 2026-10-28

The user reopened resource work and requested roughly 100 open/close cycles in Readable logs, a Freelens restart, then the same with its default log viewer. This is a focused paired comparison, separate from the original Find workload and its preserved failures.

## Method

- One UID-owned Pod continuously emits 10 short JSON records/second after 1,000 prefilled records. Both runs use the same namespace, Pod UID, container, Kubernetes server and built extension bytes.
- Each viewer runs in a newly launched Freelens 1.10.3 process and a fresh disposable integration profile; the extension is installed in both profiles. The private compositor is unchanged. No real desktop focus, workspace, pointer, clipboard or native input is manipulated.
- Find remains unopened in Readable logs. The stock search field remains empty. Both use their normal live-update behavior, without mocked responses or request interception.
- Three complete warmup cycles precede 100 measured cycles. Each cycle waits for a nonbusy, nonempty real snapshot whose newest fixture sequence exceeds the preceding cycle, waits 500 ms, then actually unmounts/closes the viewer. The default tab close control must remove both its DOM tab and stored tab data; collapsing the dock does not count.
- After each close: 250 ms idle, two natural animation frames, console discard, main/renderer forced GC, then one retained-resource sample. Every measured sample is compared with the third warmup sample. This baseline convention is consistent across this pair; the earlier installed Find soak used its first measured sample as baseline.
- The existing gate is unchanged: at most +128 DOM nodes, +8 listeners, zero extra documents, +8 MiB renderer heap in **every** measured sample. Main/renderer RSS and thread changes are descriptive; RSS has no acceptance threshold here. Counters cover the whole renderer, not just the viewer.
- After the 100 measured cycles, a separately labeled 11-second mounted control checks that fixture sequence advances through normal automatic refresh. Its resource sample is separate from the primary verdict.

## Fairness limits

Readable logs is a full-page extension route. The stock viewer is a dock above Overview. Returning from our route reactivates the underlying host page, whereas stock opens/closes a dock on it; this is a route/layout difference inherent in the ordinary user flows. Host-only inactivity/route controls have previously accumulated ClusterView nodes, so a DOM difference alone does not identify an owner.

The installed implementations ([source excerpts](host/resource-compare-20261028/host-source.json)) request different data: Readable logs asks for the latest 1,000 lines as a replacement snapshot about every three seconds, while stock initially asks for 500 lines and then appends sinceTime results about every ten seconds. Readable logs renders the bounded 1,000-record window; stock virtualizes visible rows. The primary churn cycles finish before either automatic refresh interval, while the separate mounted controls verify that active updates work. This comparison measures the actual default flows, without normalizing these product differences.

The original mounted Find soak also selected the root Extensions page and returned to the cluster on each cycle, exercising cluster deactivation/reactivation. This requested comparison only opens/closes the log viewer while the cluster remains selected. A clean result here cannot clear failures from that broader workload.

The private compositor uses the already documented diagnostic Aquamarine library. The results establish this Linux/private-session DOM workload, not native input latency, stock-platform behavior, an unbounded soak, ownership of aggregate retention, or resolution of the original intermittent Find failures. Per-cycle forced GC measures retained memory; RSS also includes caches and allocator effects.

## Results

Both viewers completed **100/100 measured cycles with zero gate violations**. No measured post-close sample grew DOM nodes, listeners or documents relative to its warmed baseline.

| Post-close resource | Readable logs | Freelens default logs |
| --- | ---: | ---: |
| DOM nodes, baseline → final | 437 → 437 | 671 → 671 |
| Event listeners, baseline → final | 700 → 700 | 751 → 751 |
| Documents, baseline → final | 4 → 4 | 4 → 4 |
| Renderer heap, MiB (delta) | 69.27 → 60.07 (-9.20) | 70.25 → 73.78 (+3.53) |
| Renderer RSS, MiB (delta) | 433.15 → 421.67 (-11.48) | 426.93 → 428.78 (+1.85) |
| Renderer external allocations, MiB (delta) | 41.95 → 41.95 (-0.00) | 42.12 → 46.93 (+4.82) |
| Main-process heap, MiB (delta) | 31.00 → 32.01 (+1.01) | 31.11 → 31.60 (+0.49) |
| Main-process RSS, MiB (delta) | 359.09 → 358.80 (-0.30) | 361.64 → 357.85 (-3.79) |
| Main / renderer threads, baseline → final | 36 / 27 → 37 / 27 | 39 / 26 → 38 / 27 |
| Find workers started / live after close | 0 / 0 | 0 / 0 |
| Violating measured samples | 0 / 100 | 0 / 100 |

Every measured sample had zero DOM/listener/document growth. The largest renderer-heap delta was -4.52 MiB for Readable logs and +3.53 MiB for stock, both below +8 MiB. The largest renderer-RSS delta was -4.00 MiB and +4.95 MiB respectively; RSS is descriptive here. External allocations are recorded separately and have no gate.

The stock renderer heap rose by 3.53 MiB over these 100 cycles, while ours ended 9.20 MiB below its warm baseline. One bounded run with different host layouts and normal GC/cache variation does not establish a leak, a future plateau, or a general memory-efficiency ranking. This run did not reproduce the earlier DOM/listener failure.

All 100 Readable snapshots contained 1,000 records and rendered 1,000 rows; stock contained 500 records and rendered 20 visible rows. Every cycle observed a newer real fixture sequence. The separate 11-second controls advanced Readable sequence 3,494 → 3,589 and stock sequence 4,649 → 4,749 (stock log count 500 → 598), confirming automatic updates were active. No Find workers started because Find was unopened.

Both measured hosts exited normally with code 0 before the next launch or cleanup. The three warmups plus 100 cycles and live control took 126.01 seconds for Readable logs and 102.16 seconds for stock; these durations include readiness polling, fixed waits and forced collections and are not user-input latency measurements.

The unchanged tarball was `freelens-readable-logs@0.1.34`, SHA-256 `15f99148d56a5b6100b929ff79c5d9b3680c9186a36dc5d5e08706bfed67749b`. The installed main, renderer and worker hashes match this worktree in both fresh profiles.

Evidence: [Readable raw run](host/resource-compare-20261028-readable/comparison.json.gz), [stock raw run](host/resource-compare-20261028-default/comparison.json.gz), [independently recomputed sample summary](host/resource-compare-20261028/comparison-summary.json), [Readable identity](host/resource-compare-20261028-readable/package-identity.json), [stock identity](host/resource-compare-20261028-default/package-identity.json), [shared Pod identity](host/resource-compare-20261028/fixture.json), [installed stock source excerpts](host/resource-compare-20261028/host-source.json). The parent also independently recomputed all 200 samples and confirmed the counters and gates.

## Reproduction

With the project-local Node toolchain, built tarball and private session already prepared:

```sh
export FIND_HOST_TICKET=48
export FIND_HOST_RUN=resource-compare-20261028
python3 scripts/find-production-host/comparison-fixture.py
```

For each treatment (`readable`, then `default`), create a new profile and process. Quit the preceding owned host and confirm its normal exit before preparing the next profile. Use a new evidence run name to preserve existing results.

```sh
export FIND_HOST_RUN=resource-compare-20261028-readable
python3 scripts/find-production-host/prepare.py
mkdir -p "docs/verification/48/host/$FIND_HOST_RUN"
python3 scripts/find-production-host/launch.py
```

In a second shell with the same ticket/run environment (the host launch keeps running in its first shell):

```sh
.scratch/readable-logs/toolchain/node_modules/node/bin/node scripts/find-production-host/comparison-setup.mjs
.scratch/readable-logs/toolchain/node_modules/node/bin/node scripts/find-production-host/identity.mjs
FIND_COMPARE_VIEWER=readable .scratch/readable-logs/toolchain/node_modules/node/bin/node scripts/find-production-host/compare-viewers.mjs
.scratch/readable-logs/toolchain/node_modules/node/bin/node scripts/find-production-host/quit.mjs
```

Repeat with a fresh profile/process, `FIND_HOST_RUN=resource-compare-20261028-default` and `FIND_COMPARE_VIEWER=default`. The setup helper installs the worktree tarball and rewrites the observer output path to the current worktree at evaluation time. It never installs in the user's profile.

Saved completed raw runs are gzip-compressed with deterministic headers after the run; the harness initially writes `comparison.json`.

The first Readable harness attempt passed extra fixture metadata as navigation parameters and remained on Overview until its readiness timeout. It measured no cycles. Its incomplete evidence is preserved under [resource-compare-20261028-readable-incomplete](host/resource-compare-20261028-readable-incomplete/comparison.json). The route parameters were restricted to namespace, Pod name/UID and cluster ID before the fresh measured run.

## Cleanup

Both measured hosts and the incomplete harness host exited normally (code 0); their three disposable profiles were removed. No owned host survives, and ports 9241/9242 are free. Both the comparison producer namespace and the inherited Find-fixture namespace were deleted after namespace UID/ownership-label checks. [Cleanup record](host/resource-compare-20261028/cleanup.json). The private-display supervisor then completed without error and its owned compositor processes exited.

The [read-only real-desktop observation](host/resource-reopen-20261028/real-desktop.json) spans the entire investigation, including the earlier focused controls. Focus and workspace endpoints match; pointer and client-set endpoints differ, and 781 desktop events were recorded. No unchanged-desktop interval is claimed. No focus restoration, native input or clipboard action was issued.

The private runtime, temporary source copies, borrowed toolchain symlink and
generated Python caches were removed after validation. [Final cleanup](host/resource-compare-20261028/final-cleanup.json).

Fixture deletion checks namespace UID and ownership label before deleting it:

```sh
FIND_HOST_TICKET=48 FIND_HOST_RUN=resource-compare-20261028 python3 scripts/find-production-host/comparison-fixture.py delete
```
