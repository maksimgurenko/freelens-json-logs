# #48 continuation: installed snapshots and delayed SDK delivery

Continuation baseline/review HEAD: `55dde7847bde0aac0983d50ee449f5da29d4a892`.
The original ticket fixed point remains
`3fb33db5f5ded3523bcf66c1145f0af967ec0bf3`. Claimed **Verify production Find
against the acceptance matrix** with `gh issue edit 48 --add-assignee @me`.
[Live full bodies/comments](host/snapshots/authority.json) still match the cached
#36/#37/#38/#40/#48 authority. No production source or package bytes changed.
No original full acceptance criterion is newly satisfied; release acceptance
remains open. No comments, issue closure, push, PR, merge or release.

## Artifact and environment

Fresh isolated Extensions-form installation, submitted once before opening a
cluster. [Installed asset hashes and environment](host/snapshots/package-identity.json)
match local production main, renderer and worker assets. Package
`freelens-readable-logs@0.1.34`, store/name `freelens-readable-logs`, page/config
`readable-logs`, schema 3, pinned Freelens **1.10.3**. Tarball SHA-256:
`1775d0f0aaa1d23002bf723d68c6840fa44d2c6bd3c5536e72bbc05546f0fdf1`.
Electron **41.10.0**, embedded Node **24.18.0**, Chromium **146.0.7680.216**.

The private labwc → Hyprland environment uses the exact private Aquamarine
diagnostic build described in [cadence.md](cadence.md). It provides natural
frames on its own workspace 7; this is **not stock compositor acceptance**.
[Cadence](host/snapshots/frame-cadence.json) repeats 61 natural rAF callbacks
without a screenshot pump. No native input, clipboard, fake focus or user-window
operation is used. Browser/DOM events remain distinct from physical input.

## Newly covered installed boundaries

[Snapshot acceptance](host/snapshots/snapshot-acceptance.json): **24 checks pass**
through actual Kubernetes snapshots, the packed renderer and real SDK/worker:

- A row-zero match is included; repeated application content has separate
  observed occurrences. Appending logs preserves a retained row, text node,
  DOM Range selection, independent inspector and active result.
- A zero-hit query gaining an actual appended match updates its count without
  choosing it. Explicit navigation then selects the new hit.
- A profile created/saved through the production editor changes message
  extraction to an escaped alternate field. Its decoded-only hit appears without
  a fetch or selection; switching back removes the active hit without replacement.
  Cluster-wide apiserver log-request counters are **28599 → 28599 → 28599** in
  this interval. Equality rules out a log fetch by any client during the interval;
  the counters do not attribute increases to an individual client.
- Eviction is tested with a **live** old reading row, inspector and active Find
  occurrence before appending 1,005 records. The real tail contains exactly
  1,000 rows starting at `new 5 upstream`; the old source/inspector/result expire.
  A new search starts at retained row zero, without a text/index fallback.
- Two real restarts of the same container reset query, Match case, result and history.
  One restart happens during Pause: old logs clear, Pause and manual profile
  remain, and explicit Refresh reads current logs. The other happens while
  unpaused: ordinary automatic current-instance snapshots return.

Repeated **application content** in this test has distinct Kubernetes timestamps.
It does not establish the exact identical-transport-line `[start,x,end]` mapping
at the installed boundary, nor missing/count-then-ID metadata arrival. Whole words
was not enabled/asserted across restart; automatic acquisition was asserted, but
following status/movement was not. The original saved JSON's `query/flags/result`
label is broader than its Match-case-only assertion and is **not** credited as
both-flag coverage. Its original bytes are retained; the harness label is corrected
for future runs. Those remaining cases
remain Core/Browser evidence pending corresponding controlled Host observations.
DOM selection preservation does not establish physical drag/clipboard behavior.

[Held SDK replies](host/snapshots/held-replies.json): **13 checks pass** with the
actual packed worker and real SDK ownership. A temporary wrapper around the
isolated main's existing extension-scoped request handler holds **completed**
responses or injects a labelled transport error. The original handler still
receives the actual event/token/request and performs production matching. The
wrapper is restored and its gates released in `finally`.

- Current success after inspector dismissal updates counts without resurrecting
  an origin/inspector/result. A newer query rejects both a held old success and
  an injected late transport failure.
- Manual scrolling cancels an older reveal while a live selection may complete.
  Closing/reopening Find never replays the held selection intent.
- Holding delivery past the renderer's whole-attempt timeout leaves input
  available, rejects late success and latches feedback. Refresh does not retry.
  Explicit Retry uses current data without old reveal permission; an explicit
  edit creates a new search intent.
- A controlled decoration transport failure preserves exact count/navigation
  and eligible explicit-navigation history.

These are controlled **delivery/transport** races, not naturally slow workers,
nor tests of every window/message/context stale-key dimension. Actual worker
startup timeout/exit is exercised separately below.

## Regression and resource observations

Fresh current-package runs:

- [33 DOM-state checks](host/snapshots/state-acceptance.json),
  [terminal-Q source/highlight samples](host/snapshots/long-source.json),
  [10 SDK/frame cases](host/snapshots/sdk-suite.json), and
  [20 latest-only cancellation bursts](host/snapshots/actual-host-churn.json) pass.
  The latter ends with **88 starts / 88 actual exits**, peak one, zero owners,
  opening/retirement/sender maps and no owner sweep.
- [Inspector-stalled startup](host/snapshots/startup-timeout.json) expires in
  **1,000.91 ms**, observes actual exit and recovers explicitly. This is one
  controlled sample, not a hard real-time guarantee or input-latency measurement.
- [Mounted resources](host/snapshots/mounted-soak-clean-inspector.json) pass the
  existing thresholds: three warmups and six measured cycles per bound, natural
  frames, original dense `a` and terminal `Q` workloads. Dense retained growth:
  **+5 nodes / +6 listeners / +560,548 B heap / +2,752,512 B RSS**. Long:
  **−4 nodes / −5 listeners / +157,836 B heap / +1,290,240 B RSS**.
  Each teardown observes actual worker exit and empty owners/senders/retirement
  state. The short modified-compositor run does not establish a long resource
  plateau, exhaustive disk behavior, native input responsiveness or stock display
  behavior. Earlier resource failures remain historical failures.
- [Pinned command results](host/snapshots/checks.json) record locked install,
  typecheck, **249/249** tests, six UI guards, production browser, real built workers,
  resource smoke and strict packed checks. [Two-build hashes](host/snapshots/reproducibility.json)
  retain deterministic package identity. See the exact command output files
  beside the JSON; these results do not supply missing platform evidence.
- [Actual shutdown during worker startup](host/snapshots/shutdown-clean.json)
  records a closed service, zero owners/opening/retiring/senders/sweep and the
  observed worker exit before the owned process exits with code zero. This is
  process/SDK lifecycle evidence, not physical window-button delivery.

## Reproduction and failed harness attempts

Keep `FREELENS_UI_MODE` unset. From this checkout:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
node --version # v24.18.0
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js --version # 11.16.0
export FIND_HOST_TICKET=48
export FIND_HOST_RUN=snapshots # choose a new run directory for a new attempt
python3 scripts/find-production-host/prepare.py
python3 scripts/find-production-host/fixtures.py
# Supervise separately, using the private diagnostic build from cadence.md:
FIND_DISPLAY_RENDERER=mesa LD_LIBRARY_PATH="$PWD/.scratch/find/48-host/aquamarine/build" python3 scripts/find-production-host/display.py
python3 scripts/find-production-host/launch.py
node scripts/find-production-host/install.mjs
node scripts/find-production-host/cdp.mjs 9242 main scripts/find-production-host/observer.cjs
node scripts/find-production-host/open-view.mjs
python3 scripts/find-production-host/snapshot-fixture.py
node scripts/find-production-host/snapshot-acceptance.mjs
node scripts/find-production-host/held-replies.mjs
node scripts/find-production-host/frame-cadence.mjs
node scripts/find-production-host/long-source.mjs
node scripts/find-production-host/state-acceptance.mjs
FIND_SOAK_INSPECTOR_CLEAN=1 FIND_SOAK_NATURAL_FRAMES=1 node scripts/find-production-host/mounted-soak.mjs
node scripts/find-production-host/suite.mjs
node scripts/find-production-host/timeout.mjs
node scripts/find-production-host/churn.mjs
node scripts/find-production-host/shutdown.mjs
```

Use the documented pinned npm CLI for `ci --ignore-scripts --no-audit --no-fund`,
`run typecheck`, `test`, `run test:browser`, `run test:workers`, `run test:smoke`,
`run package`, `run check:package`, and a second `run package`/SHA-256 comparison.
Also run `python3 -B -m unittest discover -s tests -p ui_desktop_test.py -v`.
The actual commands/exit codes are in `checks.json`.

Retained failed attempts are **harness failures**, not product regressions:
[SDK proxy instrumentation](host/snapshots/snapshot-acceptance-instrumentation-failed.json),
[Chromium Network observation](host/snapshots/snapshot-acceptance-network-failed.json),
[metrics buffer](host/snapshots/snapshot-acceptance-metrics-buffer-failed.json),
[mode-pending wait](host/snapshots/snapshot-acceptance-mode-pending-failed.json),
[selector escaping](host/snapshots/snapshot-acceptance-selector-failed.json), and
[Retry button label](host/snapshots/held-replies-button-failed.json).
SDK exports are read-only proxies; Node HTTP is not Chromium Network traffic.
The final harness changes neither. Metrics collection now allows its real output
size, mode navigation waits for readiness, and the selectors/control names match
the existing UI. A preliminary passing snapshot run without the stronger live
eviction precondition is preserved separately and not promoted to that assertion.

## Remaining work

Continue only #48 using [NEXT.md](NEXT.md). Installed full inspector/foreign/
multiline/Unicode seed cases, measured widths/layout/fonts/grouped marks/following,
additional stale snapshot/message/context cases and current-artifact extension
maintenance/window lifecycle still need their own evidence. Whole words reset
and following status/movement across restart remain unverified. Exact duplicate
transport windows and partial metadata ordering need controlled Host observations.
Stock/long-duration resource acceptance remains open. Physical/native/clipboard
and Windows/macOS checks remain **unverified**. No checkbox is checked by this
partial checkpoint, and no release acceptance is claimed.

## Cleanup and desktop observation

[Cleanup](host/snapshots/cleanup.json) verifies zero processes referring to the
owned profile/runtime, removes that profile (including its copied credential),
private runtime and UID-checked namespace, and preserves recorded hashes for the
user's extension configuration, dirty Glossary and docs index. Private display
build/cache files remain in scratch for reproducibility. No `.ralph` runtime or
credentials are committed.

[Desktop summary](host/snapshots/desktop-summary.json) records equal focus,
workspace, client lists and pointer endpoints. The whole-interval observer saw
**9,345 notifications of the same already-active window**, zero workspace/client
open/close events. This is not called zero events or proof of physical-input or
continuous pointer stability. The [losslessly retained event stream](host/snapshots/real-desktop.json.gz)
and logs preserve the original observations; all display mutations targeted only
the private runtime. [Independent review](review-snapshots.md) is scoped to this
continuation plus the original ticket diff.
