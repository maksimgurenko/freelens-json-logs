# #48 continuation: state boundaries and bounded dense diagnosis

Continuation/review baseline: `9280757b9c79b4f5d3944ea8bcc92699f67dda8c`.
Reclaimed **Verify production Find against the acceptance matrix** with
`gh issue edit 48 --add-assignee @me`. [Fresh full-body/comment comparisons](host/state-completion/authority.json)
match cached #36/#37/#38/#40/#48 authority. The accepted cached plan hashes exactly
to the artifact at `d02b7e7c19c8e48b1cde714f0a23813b40374824`.

This is a partial checkpoint. No production bytes or accepted contract changes;
no original unfinished acceptance criterion is checked. No issue comment/closure,
push, PR, merge or release. Physical/native/platform, dense responsiveness and
full resource acceptance remain open.

## Package and environment

The real Extensions form installed `freelens-readable-logs@0.1.34` once, before
any cluster, in a fresh isolated profile/process. [Installed identity](host/state-completion/package-identity.json)
and [later verified assets/schema](host/dense-diagnostic/package-identity.json)
match all three local versioned main/renderer/worker assets. Tarball SHA-256:
`d19f826bc8496a6ae3ca5afaeb79fab73753ceeebde62747174b8d4ead6dfcb3`.
Stable package/store `freelens-readable-logs`, page/config `readable-logs`, schema 3;
host pin Freelens 1.10.3. Electron 41.10.0 / embedded Node 24.18.0 / Chromium
146.0.7680.216. Build/driver Node 24.18.0 / npm 11.16.0; host CWD `/home/max`.
Polling uses `CHOKIDAR_USEPOLLING=1`, `CHOKIDAR_INTERVAL=100`.

The separate labwc → Hyprland workspace 7 uses the documented private Aquamarine
diagnostic build from [cadence.md](cadence.md). Natural frames are observed without
screenshots; `document.hasFocus()` remains false. `FREELENS_UI_MODE` stays unset.
No user window activation/restoration, pointer movement, native input, clipboard
operation or fake focus. Modified-compositor results are not stock-display or
native input acceptance. The second namespace has new ownership and fixtures;
it reuses the isolated host, not the deleted first namespace.

## State evidence through the installed production package

[20 state-boundary assertions](host/state-completion/state-boundaries.json):

- Current-package origin 64 → 73 → 82. DOM Tab/focus intent chooses reading row
  90 without changing inspector 64; closing that inspector preserves row 90.
  Hidden-source inspection and programmatic focus return also preserve that
  independent reading row. This explicitly delivers `focusin` in an unfocused
  document, following the existing production-browser boundary; it is not real
  keyboard or OS focus delivery.
- Saved profile extraction retains a still-matching candidate. Held real worker
  replies prove newer `windowRevision` and `messageRevision` inputs, then reject
  both old successes and injected transport failures without changing current
  result/count/query/scroll. Only SDK delivery is controlled; production ownership,
  input validation, worker execution and reply validation remain in use.
- Entering Profiles cancels held selection/reveal permission; return preserves
  useful counts, and fresh navigation can reveal. Exactly seven completed zero-hit
  history tuples remain in MRU order; same text with different flags is distinct.
  A source seed into empty Find preserves both flags.

[31 real snapshot/restart assertions](host/state-completion/snapshot-acceptance.json)
repeat the prior actual Kubernetes append/profile/retention subset and strengthen
the two real restart cases. Both Match case and Whole words are proven enabled
before each restart and reset afterward. Explicit following is enabled before
restart and preserved afterward. Real post-restart appended output reaches the
bottom: paused mode waits for Refresh, automatic mode follows its new snapshot.
Pause, manual profile and empty post-restart history remain independently checked.

[19 controlled snapshot assertions](host/instance-review/controlled-snapshots.json)
exercise the actual installed SDK adapter/session/viewer/main-worker path with
target-scoped **HTTP response-body/delivery controls**:

- Exact complete transport lines `[start, x, end] → [x, end, x]` retain old `x`
  at index 0 across inspector, active result, reading row, source node and DOM
  selection. Identical windows preserve observed identity; zero overlap expires
  references without text/index recovery. These deliberately supplied timestamped
  responses do not claim that Kubernetes naturally emitted identical timestamps.
- Initially missing metadata, first-known count/ID, temporary disappearance and
  count-then-ID arrival do not spuriously reset. Known count changes and differing
  known IDs reset at the documented boundary while preserving Pause.
- Real completed matching replies held at SDK delivery remain pending until a
  controlled new-instance metadata observation. Old successes/injected transport
  failures cannot repopulate reset Find; subsequent successful keys have strictly
  newer instance epochs. Old-instance snapshot completion and injected log
  transport failure cannot repopulate or fail the cleared paused window.

The HTTP interceptor is scoped to the owned Pod's exact metadata/log paths and
successful responses. It consumes actual responses, then supplies controlled
bodies/delivery to the real SDK. Other requests pass through. Its descriptor and
all gates are restored/released in cleanup. This is controlled boundary evidence,
not natural kubelet ordering or an atomic UID-bound read claim.

Independent Spec review found that the earlier
[controlled run](host/dense-diagnostic/controlled-snapshots.json) checked only
non-repopulation/absence of timeout after an old-instance failure. It could miss
an execution-error latch erased by the next edit. The current linked
`instance-review` run repeats all 19 assertions in a third fresh private profile/
process/namespace, proves pending status before reset, and records exact empty
Find status with no Retry **before** another edit for both old success/error.
This supplies the corrected current error-latch evidence; the earlier raw file
is retained with that limitation. No production fix or timer policy change.

Fresh confirmations in the second namespace pass [33 DOM state assertions](host/dense-diagnostic/state-acceptance.json),
[13 held SDK assertions](host/dense-diagnostic/held-replies.json), [10 SDK/frame cases](host/dense-diagnostic/sdk-suite.json),
[startup-inclusive timeout/actual exit](host/dense-diagnostic/startup-timeout.json)
at 1,001.21 ms, and [20 latest-only bursts](host/dense-diagnostic/actual-host-churn.json).
These retain their established DOM/controlled-delivery scope, not native delivery.

## Dense diagnostic and resource failure

[Bounded replay](host/dense-diagnostic/dense-diagnostic.json) expands and SHA-256
verifies the exact preserved earlier stalled harness beside its driver, samples
the actual renderer with DevTools Profiler for about 40 seconds, then stops only
the owned driver and disposes its page. Its historical regrouping oracle is known
to be wrong and is not used as acceptance. Only **seven activations** complete in
40.06 seconds. The [raw CPU profile](host/dense-diagnostic/dense-cpu-profile.json.gz)
retains 38,439 samples over 40.25 seconds. Top self samples include `(program)`
21.13 seconds, a highlight-projection callback 2.71 seconds, `displayTimestamp`
2.05 seconds, viewport `restore` 1.34 seconds and clipping 1.23 seconds.
These are individual profiler-node self samples, not aggregate function totals
or native input latency. Attribution to product/layout/host/private display is
still unresolved. No fallback, budget change or speculative product fix is made.

[Mounted lifecycle sampling](host/dense-diagnostic/mounted-soak-clean-inspector.json)
has three warmups/six measured cycles per bound. All lifecycle/actual-exit checks
pass. **Resource verdict fails:** dense growth is +27 nodes, **+15 listeners**,
+862,544 B heap, +696,320 B RSS; the existing listener threshold is +8. Long:
+5 nodes, zero listeners, +185,764 B heap, −561,152 B RSS. Dense listener counts
step from 828 to 843 at sample 2 and then remain near that value. This does not
establish a leak cause or plateau; it remains failed evidence. This long-lived
profile had earlier state/instrumentation/profiler workloads. It must be compared
with a clean fresh process before attributing the increase. Earlier passing
short samples do not erase this failure or establish long-duration acceptance.

The [fresh-process control](host/resource-control/mounted-soak-clean-inspector.json)
uses a second new profile/process and a single real form installation of the same
package before any cluster. No controlled-delivery or CPU-profiler workload
precedes its soak. Three warmups/six measured cycles per bound **pass**: dense
+15 nodes, +1 listener, +1,069,232 B heap, +4,653,056 B RSS; long +5 nodes,
zero listeners, +160,260 B heap, −331,776 B RSS. This narrows the next investigation
to the preceding workload/host state and is not proof that the failed increase
was benign or that a long plateau exists. [Identity](host/resource-control/package-identity.json)
matches the package/assets; schema 3 is effective through the existing pure
configuration decoder. Its fresh file contains only SDK migration metadata and
has no persisted application schema yet. The first identity assertion incorrectly
required a persisted schema; correcting that diagnostic does not write settings
or change the production migration contract.

## Harness failures and verification limits

Failed attempts remain separate:

- [Unfocused-event precondition](host/state-completion/state-boundaries-unfocused-event.json):
  `.focus()` changes `activeElement` without emitting `focusin`. Explicit DOM-event
  delivery corrects the harness; no production focus guard is bypassed.
- [Original state suite](host/state-completion/state-acceptance.json) and
  [held suite](host/state-completion/held-replies.json) were incorrectly rerun after
  the new window-race workload appended two records to their 120-row fixture.
  They fail that unchanged precondition. Fresh namespace repetitions above pass.
- [Controlled selection precondition](host/dense-diagnostic/controlled-snapshots-selection-precondition.json):
  input editing replaced the earlier DOM Range; establish selection after editing.
  [Eval quoting failure](host/dense-diagnostic/controlled-snapshots-eval-quoting.json)
  stopped at the new pending precondition and is corrected. Neither is a product
  defect. The earlier 13-check pass is retained separately from the final 19.

No physical selection/copy/clipboard, native paste/Undo/Redo/IME/AltGraph/modifiers,
menus, OS focus, physical window-button delivery or Windows/macOS coverage.
Focus-dependent Escape/shortcut ownership cannot be verified in this unfocused
document. Do not fake focus to fill those cells. Remaining work is [NEXT.md](NEXT.md).

## Reproduction

Run from this checkout with the documented local toolchain and a fresh safe run
name/owned namespace. Do not reuse historical PIDs, UIDs or profiles:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
export FIND_HOST_TICKET=48 FIND_HOST_RUN=state-completion
python3 scripts/find-production-host/prepare.py
python3 scripts/find-production-host/fixtures.py
python3 scripts/find-production-host/snapshot-fixture.py
# Supervise the display and host in separate long-lived commands.
FIND_DISPLAY_RENDERER=mesa LD_LIBRARY_PATH="$PWD/.scratch/find/48-host/aquamarine/build" python3 scripts/find-production-host/display.py
python3 scripts/find-production-host/launch.py
node scripts/find-production-host/install.mjs
node scripts/find-production-host/cdp.mjs 9242 main scripts/find-production-host/observer.cjs
node scripts/find-production-host/open-view.mjs
node scripts/find-production-host/state-boundaries.mjs
node scripts/find-production-host/snapshot-acceptance.mjs
node scripts/find-production-host/identity.mjs
```

`state-boundaries` appends to the owned traces container. The unchanged state/held/
mounted suites need a new 120-row namespace afterward. Delete only the UID-checked
old namespace with `fixtures.py delete`, choose a new `FIND_HOST_RUN`, and run
`fixtures.py` and `surface-fixture.py` again. The private host/profile may remain.
Run `controlled-snapshots.mjs` for controlled HTTP cases; `dense-profile.mjs` for
the sampled diagnostic. Its temporary adjacent script is removed on exit.

## Final checks, review and cleanup

[Exact final commands and results](host/state-completion/checks.json) pass locked
installation, typecheck, **249 tests**, six desktop policy tests, mounted production
Chromium, real built workers, resource smoke and strict actual-package checks.
[Two-build reproducibility](host/state-completion/reproducibility.json) retains the
same package SHA-256. These automated passes do not erase the installed resource
failure. No test seam or production code is changed to make a failing gate pass.

[First cleanup](host/state-completion/cleanup.json) verifies the first two owned host processes
exited 0 (including real startup workers), all actual starts/exits matched, no
process retains either profile or the display runtime, both profiles/private
runtime were removed, and the fixture namespaces were deleted with stored UID
checks. Private package/source/build caches remain in scratch for reproducibility.
User settings and the dirty Glossary/docs index retain their baseline hashes.

[Desktop observation](host/state-completion/desktop-summary.json) has identical
focus/workspace/pointer/client endpoints. Its continuous event stream contains
12,599 notifications of the same active window, with no workspace/open/close
events. This is not described as zero events or proof of continuous pointer
stability. All native mutations targeted only the owned private display; no real
desktop input/focus/clipboard calls occurred. Logs/event streams are losslessly
compressed; no credential/profile or .ralph runtime is committed.

[Fresh review-run cleanup](host/instance-review/cleanup.json) separately verifies
the third profile/runtime and UID-checked namespace removed, zero owned processes,
startup shutdown with two actual worker starts/exits and empty service state, and
unchanged user/config hashes. Its [desktop interval](host/instance-review/desktop-summary.json)
has identical endpoints and 1,413 same-window notifications, with no workspace/
open/close events. The same limits on pointer/native continuity apply.

[Independent Standards and Spec reviews](review-state-completion.md) leave zero
hard Standards violations and zero unresolved Spec findings after the stronger
fresh installed run and corrected matrix/evidence links. One optional duplicate
input-helper smell is deferred. All failures and unperformed gates remain release
limits; the exact autonomous continuation is [NEXT.md](NEXT.md).
