# #48: accepted resource deferral and final functional host checks

Continuation/review baseline: `27e4d828c436a697dba4520593df0d4579914980`.
Original ticket pin: `3fb33db5f5ded3523bcf66c1145f0af967ec0bf3`.
Selected **Verify production Find against the acceptance matrix** and claimed it
with `gh issue edit 48 --add-assignee @me` before work. [Live complete authority](host/functional-final/authority.json)
matches cached #36/#37/#38/#40/#48 decisions and the exact accepted plan.

On 2026-10-27 the user explicitly accepted and deferred the DOM/listener issue
covered by the [resource summary now retained in the specification](../../design/find-implementation-plan.md#resource-investigation-tldr).
This checkpoint commits that scoped decision, preserving the original criterion
text and the user's resource execution/reporting checkbox. **No resource
attribution, request/timer/queue probe, timing control, further soak or related
stock-display investigation was performed after that decision.** Existing failed
measurements and thresholds remain unchanged; there is no resource pass or fix claim.
Native/clipboard and actual Windows/macOS coverage were not waived.

## Available functional work completed

[New installed context checks](host/functional-context-reviewed/context-boundaries.json)
pass **16 assertions** at the actual production viewer/session/adapter/SDK/worker
seams. Response controls are explicit, not substituted implementations:

- Inspected A and independently DOM-keyboard-chosen reading row B are distinct.
  A controlled exact-transport overlap evicts A while preserving B's occurrence
  and DOM row. After Clear, a fresh query finds B at index 1, skipping earlier
  matching C at index 0; no inspector reopens and Pause remains set.
- Four held-reply cases cover target replacement and same-target viewer remount,
  each with an actual successful worker reply and an injected transport rejection.
  Old navigation is demonstrably pending before replacement. A new actual viewer
  epoch and main-owned token identify the replacement, which obtains its own
  current success before the old reply is released. Query, count, active result,
  row count, scroll, flags, inspection and Pause stay equal; no Retry is latched.
  Target changes use a second actual UID-checked-owned-namespace Pod. In production
  `targetEpoch` stays 1 within a keyed viewer; target replacement remounts the viewer
  and changes viewer identity/owner. No synthetic target-epoch increment is claimed.

Review follow-up explicitly verifies each held reply has `kind: matches` and
exactly four matching records before replacement, then records that oracle in
all four deliveries. A fresh isolated installation repeats all 16 assertions;
[reviewed identity](host/functional-context-reviewed/package-identity.json) has
the same package/assets. The earlier context run remains separate.

Spec review also identified missing installed four-mode range/mark agreement.
[Focused D10 evidence](host/functional-modes-reviewed/mode-agreement.json) now
passes all four combinations on `UPSTREAM`, `upstream`, `xupstreamx`, `quiet`.
Independent expected matching rows are `[0,1,2]`, `[1,2]`, `[0,1]`, `[1]` for
neither flag, case, words and both. Real SDK match/range replies have the same
complete key and flags; returned rows, visible Custom Highlights and every
activated mark agree. The [fresh installation](host/functional-modes-reviewed/package-identity.json)
is the same final artifact. No browser result substitutes for this Host cell.

The [late composition probe](host/functional-final/composition-clear.json) verifies
that Clear during synthetic composition stays empty after a late composition-end
and a later observation, with no highlights. It is DOM boundary evidence, not
native IME or clipboard evidence.

To reconcile older artifact scopes against the final package, this installation
also passes [20 state-boundary assertions](host/functional-final/state-boundaries.json),
[19 controlled instance/snapshot assertions](host/functional-final/controlled-snapshots.json)
and [31 real snapshot/restart assertions](host/functional-final/snapshot-acceptance.json).
These include all stale query/window/message/instance counterparts, exact duplicate
transport-line/zero-overlap mapping, missing/count-then-ID/known-ID metadata, no-fetch
saved-profile maintenance, actual 1,000-record eviction, and two actual container
restarts. Both flags/query/result/history reset while manual profile, explicit
Pause and following persist, including real appended-bottom movement.

The [final matrix](matrix.md) maps every D01–D16 case and all 13 state traces.
Existing same-final-artifact `feedback-final` source/geometry, settled DOM state,
held response, SDK/frame/deadline, maintenance and following evidence retains its
named layer. Final-artifact exact retention/source checks remain linked. Older
package or prototype results are not promoted to current native/platform evidence.
No production source, package version or accepted behavior changed.
Standards review narrowed the composition claim to input/highlight resurrection
and prompted independent best-effort wrapper/navigation cleanup steps.

## Failed attempts retained

The [first context probe](host/functional-final/context-boundaries-first-failed.json)
passes the four anchor assertions, then fails in its own CDP selector expression:
incorrect JavaScript quoting yields `SyntaxError: missing )`. The corrected
selector passes all 16 assertions in a new invocation; no product fix was needed.

The [first snapshot probe](host/functional-final/snapshot-acceptance-first-failed.json)
passes 18 assertions, then clicks Next during a mode transition. The old readiness
check can observe the previous query's still-enabled button before React commits
new matching inputs. The harness now waits two natural frames after each mode
toggle before checking readiness. The corrected complete run passes 31 assertions;
no timeout/threshold/product semantics were changed.

An intervening fixture replacement waited 30 seconds for graceful Pod deletion
and timed out; creation then encountered the still-terminating name. The accidental
follow-on [snapshot attempt](host/functional-final/snapshot-acceptance-fixture-failed.json)
fails its initial-five-rows precondition. Those command exits/output are retained.
After confirming the old owned Pod was absent, a fresh fixture was created and
the corrected run completed. No failed observation is relabelled passed.

## Exact package, environment and commands

[Installed identity](host/functional-final/package-identity.json):
`freelens-readable-logs@0.1.34`, SHA-256
`995f1cf5e3ac81f377b16cf8dea24c15237824cd31dd1a066acde26bf868f904`;
main/renderer/versioned worker installed hashes match local assets. Freelens
1.10.3, Electron 41.10.0, Node 24.18.0, npm 11.16.0, Chromium 146.0.7680.216;
package/store `freelens-readable-logs`, page/config `readable-logs`, schema 3.
Host CWD `/home/max`. One fresh-profile Extensions-form installation, no overwrite
or post-install restart. Process-local polling is `CHOKIDAR_USEPOLLING=1`,
`CHOKIDAR_INTERVAL=100`. FREELENS_UI_MODE remains unset.

The existing separate labwc → Hyprland workspace-7 workflow uses the recorded
modified Aquamarine diagnostic. This was reused for functional checks; no new
stock-display/resource investigation was undertaken. Native or stock-platform
acceptance is not inferred from it.

[Every executed wrapper command, environment, exit and elapsed time](host/functional-final/commands.json)
and [display/launch commands](host/functional-final/launch-environment.json) are
recorded. From the checkout, the functional reproduction is:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PWD/.scratch/readable-logs/toolchain/node_modules/.bin:$PATH"
export FIND_HOST_TICKET=48 FIND_HOST_RUN=functional-final
python3 scripts/find-production-host/prepare.py
python3 scripts/find-production-host/fixtures.py
# Supervise the owned display and host separately:
FIND_DISPLAY_RENDERER=mesa LD_LIBRARY_PATH="$PWD/.scratch/find/48-host/aquamarine/build" python3 scripts/find-production-host/display.py
python3 scripts/find-production-host/launch.py
node scripts/find-production-host/install.mjs
node scripts/find-production-host/cdp.mjs 9242 main scripts/find-production-host/observer.cjs
node scripts/find-production-host/open-view.mjs
node scripts/find-production-host/identity.mjs
node scripts/find-production-host/context-boundaries.mjs
node scripts/find-production-host/state-boundaries.mjs
node scripts/find-production-host/controlled-snapshots.mjs
python3 scripts/find-production-host/snapshot-fixture.py
node scripts/find-production-host/snapshot-acceptance.mjs
node scripts/find-production-host/composition-clear.mjs
```

Review follow-up commands/identities are separate under
[context-reviewed](host/functional-context-reviewed/commands.json) and
[modes-reviewed](host/functional-modes-reviewed/commands.json); the latter runs
`node scripts/find-production-host/mode-agreement.mjs` after fresh installation.
Use a fresh evidence run/owned fixture; never overwrite the retained raw results.
Response/method wrappers verify restoration, and new probes fail if teardown or
actual exit fails. Existing snapshot/state scripts report their cleanup status;
the saved results have empty service ownership/watch and zero live workers.

Pinned [typecheck](host/functional-final/typecheck-output.txt.gz), **249 tests**,
six [UI guards](host/functional-final/ui-guards-output.txt), production browser,
actual built workers and strict package checks all pass. No dependency or production
change required another install or package rebuild; the same artifact's prior
[two-build reproducibility](host/feedback-final/reproducibility.json) remains
separately recorded. Resource diagnostics/smoke/soaks were not rerun under the deferral.

## Shutdown, cleanup and remaining gate

[Actual startup shutdown](host/functional-final/shutdown-clean.json) observes
**16 worker starts/exits**, peak one, zero live workers, closed service and empty
owner/opening/retiring/sender maps/watch. The three SDK handlers are still listed
at will-quit; zero handlers at that instant is not claimed. The app exits normally.
[Owned cleanup](host/functional-final/cleanup.json) removes its private profile and
runtime after all owned host/display PIDs exit. The namespace is removed with its
UID/ownership-label checks; build/cache and unrelated scratch remain. Fresh dirty
glossary/docs-index and user-settings hashes are unchanged.

[Continuous desktop observer](host/functional-final/desktop-summary.json) records
zero focus/workspace/window notifications across ~471 seconds, identical client
sets/focus/workspace, and equal pointer endpoints. Pointer equality is endpoint
only; no native input, pointer/clipboard operation, activation, restoration or fake
focus was dispatched. Test windows stayed in private workspace 7.

The two review follow-up hosts also exit normally: context-reviewed observes
[10/10 starts/exits](host/functional-context-reviewed/shutdown-clean.json) and
modes-reviewed [2/2](host/functional-modes-reviewed/shutdown-clean.json), both peak
one with zero live workers/owner maps/watch. [Follow-up cleanup](host/functional-modes-reviewed/cleanup.json)
removes both owned profiles and their shared private runtime; the reused UID-checked
namespace is removed. [Shared-display observer](host/functional-context-reviewed/desktop-summary.json)
records zero focus/workspace/window events over ~183 seconds, matching client sets
and pointer endpoints. No resource run or native input was added.

[Independent Standards and Spec reviews](review-functional-final.md) cover the
scoped decision, harness and evidence against the recorded baseline, including the
uncommitted ticket diff. No push, PR, merge, issue comment/closure or release.

**Blocked only on fresh native attendance/access and actual platform coverage.**
Needed Linux evidence: physical selection/copy/system clipboard; native typing,
paste/Undo/Redo/IME/AltGraph; exact modifier shortcuts/menus/foreign-editor ownership;
focus/opener return; native window close/hide/minimize/restore/return and associated
execution cleanup. Arrange an explicitly attended final-package session on
workspace 7 or suitable separate native-capable session. Earlier approval does not
carry forward. Actual Windows/macOS coverage remains explicitly unverified and
requires those hosts. The reporting option is satisfied; coverage is not waived.
Original all-layer criteria remain unchecked where these subcases are unperformed.
This is a committed partial checkpoint, not release acceptance.
